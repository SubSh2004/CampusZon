/**
 * AI Image Moderation Service
 * Supports multiple AI providers with fallback logic
 * Providers: Google Vision, AWS Rekognition, Azure Content Moderator, OpenAI Vision
 */

import axios from 'axios';

/**
 * Moderation thresholds (0-1 scale)
 * Adjust these based on your risk tolerance
 */
const THRESHOLDS = {
  // Auto-approval thresholds (below these = auto approve)
  SAFE: {
    adult: 0.5,        // Increased from 0.2 - more lenient for clean images
    violence: 0.5,     // Increased from 0.2
    racy: 0.5,         // Increased from 0.3
    nudity: 0.4,       // Increased from 0.15
    explicitNudity: 0.3, // Increased from 0.1
    suggestive: 0.5,   // Increased from 0.3
    drugs: 0.4,        // Increased from 0.2
    weapons: 0.4,      // Increased from 0.2
    hate: 0.2,         // Increased from 0.1
    gambling: 0.5      // Increased from 0.3
  },
  
  // Auto-rejection thresholds (above these = auto reject)
  UNSAFE: {
    adult: 0.8,        // Increased from 0.7 - only reject very obvious violations
    violence: 0.8,     // Increased from 0.7
    racy: 0.7,         // Kept at 0.6
    nudity: 0.7,       // Increased from 0.6
    explicitNudity: 0.5, // Increased from 0.4
    suggestive: 0.8,   // Increased from 0.7
    drugs: 0.7,        // Increased from 0.6
    weapons: 0.7,      // Increased from 0.6
    hate: 0.4,         // Increased from 0.3
    gambling: 0.8      // Increased from 0.7
  }
};

/**
 * Google Cloud Vision SafeSearch API
 * Requires: GOOGLE_CLOUD_VISION_API_KEY in environment
 */
class GoogleVisionModerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://vision.googleapis.com/v1/images:annotate';
  }

  async moderate(imageBuffer) {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const response = await axios.post(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          requests: [
            {
              image: { content: base64Image },
              features: [
                { type: 'SAFE_SEARCH_DETECTION' },
                { type: 'LABEL_DETECTION', maxResults: 20 },
                { type: 'WEB_DETECTION' }
              ]
            }
          ]
        },
        { timeout: 30000 }
      );

      const result = response.data.responses[0];
      
      if (result.error) {
        throw new Error(`Google Vision API error: ${result.error.message}`);
      }

      const safeSearch = result.safeSearchAnnotation || {};
      const labels = result.labelAnnotations || [];
      const webDetection = result.webDetection || {};

      // Convert Google's likelihood (VERY_UNLIKELY to VERY_LIKELY) to 0-1 scale
      const likelihoodToScore = {
        'VERY_UNLIKELY': 0.1,
        'UNLIKELY': 0.3,
        'POSSIBLE': 0.5,
        'LIKELY': 0.7,
        'VERY_LIKELY': 0.9,
        'UNKNOWN': 0.5
      };

      return {
        scores: {
          adult: likelihoodToScore[safeSearch.adult] || 0,
          violence: likelihoodToScore[safeSearch.violence] || 0,
          racy: likelihoodToScore[safeSearch.racy] || 0,
          medical: likelihoodToScore[safeSearch.medical] || 0,
          spoof: likelihoodToScore[safeSearch.spoof] || 0
        },
        labels: labels.map(l => l.description),
        webDetection: {
          bestGuess: webDetection.bestGuessLabels?.[0]?.label,
          visuallySimilar: webDetection.visuallySimilarImages?.length > 0
        },
        provider: 'GOOGLE_VISION'
      };

    } catch (error) {
      console.error('Google Vision moderation error:', error.message);
      throw error;
    }
  }
}

/**
 * AWS Rekognition Moderation
 * Requires: AWS SDK configured with credentials
 */
class AWSRekognitionModerator {
  constructor(region = 'us-east-1') {
    // Note: This requires AWS SDK v3
    // Import dynamically to avoid errors if AWS SDK is not installed
    this.region = region;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const { RekognitionClient, DetectModerationLabelsCommand, DetectLabelsCommand } = 
        await import('@aws-sdk/client-rekognition');
      
      this.client = new RekognitionClient({ region: this.region });
      this.DetectModerationLabelsCommand = DetectModerationLabelsCommand;
      this.DetectLabelsCommand = DetectLabelsCommand;
      this.initialized = true;
    } catch (error) {
      throw new Error('AWS SDK not installed. Run: npm install @aws-sdk/client-rekognition');
    }
  }

  async moderate(imageBuffer) {
    await this.initialize();

    try {
      // Detect moderation labels
      const moderationCommand = new this.DetectModerationLabelsCommand({
        Image: { Bytes: imageBuffer },
        MinConfidence: 10 // Get all results, we'll filter later
      });

      const moderationResponse = await this.client.send(moderationCommand);
      
      // Detect regular labels for context
      const labelsCommand = new this.DetectLabelsCommand({
        Image: { Bytes: imageBuffer },
        MaxLabels: 20,
        MinConfidence: 50
      });

      const labelsResponse = await this.client.send(labelsCommand);

      // Process moderation labels
      const scores = {
        adult: 0,
        violence: 0,
        nudity: 0,
        explicitNudity: 0,
        suggestive: 0,
        drugs: 0,
        weapons: 0,
        hate: 0,
        gambling: 0
      };

      moderationResponse.ModerationLabels.forEach(label => {
        const confidence = label.Confidence / 100; // Convert to 0-1
        const category = label.ParentName || label.Name;

        if (category.includes('Explicit Nudity')) scores.explicitNudity = Math.max(scores.explicitNudity, confidence);
        if (category.includes('Nudity')) scores.nudity = Math.max(scores.nudity, confidence);
        if (category.includes('Suggestive')) scores.suggestive = Math.max(scores.suggestive, confidence);
        if (category.includes('Violence')) scores.violence = Math.max(scores.violence, confidence);
        if (category.includes('Visually Disturbing')) scores.violence = Math.max(scores.violence, confidence);
        if (category.includes('Drugs')) scores.drugs = Math.max(scores.drugs, confidence);
        if (category.includes('Tobacco')) scores.drugs = Math.max(scores.drugs, confidence * 0.5);
        if (category.includes('Alcohol')) scores.drugs = Math.max(scores.drugs, confidence * 0.3);
        if (category.includes('Weapons')) scores.weapons = Math.max(scores.weapons, confidence);
        if (category.includes('Hate Symbols')) scores.hate = Math.max(scores.hate, confidence);
        if (category.includes('Gambling')) scores.gambling = Math.max(scores.gambling, confidence);
      });

      return {
        scores,
        labels: labelsResponse.Labels.map(l => l.Name),
        moderationLabels: moderationResponse.ModerationLabels.map(l => ({
          name: l.Name,
          confidence: l.Confidence,
          parentName: l.ParentName
        })),
        provider: 'AWS_REKOGNITION'
      };

    } catch (error) {
      console.error('AWS Rekognition moderation error:', error.message);
      throw error;
    }
  }
}

/**
 * OpenAI Vision Moderation (GPT-4 Vision)
 * Requires: OPENAI_API_KEY in environment
 */
class OpenAIModerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  async moderate(imageBuffer) {
    try {
      const base64Image = imageBuffer.toString('base64');
      
      const response = await axios.post(
        this.baseUrl,
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this image for content moderation. Provide scores (0-1) for:
- adult: nudity/sexual content
- violence: violent or disturbing content
- inappropriate: offensive, hate symbols, drugs, weapons
- spam: advertisements, memes, irrelevant content
- quality: image quality and relevance for a marketplace listing

Return ONLY a JSON object with these scores and a brief reason.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);

      return {
        scores: {
          adult: parsed.adult || 0,
          violence: parsed.violence || 0,
          racy: parsed.adult * 0.7 || 0,
          spoof: parsed.spam || 0,
          drugs: parsed.inappropriate * 0.5 || 0,
          weapons: parsed.inappropriate * 0.5 || 0,
          hate: parsed.inappropriate * 0.7 || 0
        },
        labels: [],
        reason: parsed.reason || '',
        qualityScore: parsed.quality || 0.5,
        provider: 'OPENAI_VISION'
      };

    } catch (error) {
      console.error('OpenAI Vision moderation error:', error.message);
      throw error;
    }
  }
}

/**
 * Main Moderation Service
 * Manages multiple providers with fallback
 */
class ModerationService {
  constructor() {
    this.providers = [];
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize available providers based on environment variables
    
    if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      this.providers.push({
        name: 'GOOGLE_VISION',
        instance: new GoogleVisionModerator(process.env.GOOGLE_CLOUD_VISION_API_KEY),
        priority: 1
      });
    }

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.providers.push({
        name: 'AWS_REKOGNITION',
        instance: new AWSRekognitionModerator(process.env.AWS_REGION || 'us-east-1'),
        priority: 2
      });
    }

    if (process.env.OPENAI_API_KEY) {
      this.providers.push({
        name: 'OPENAI_VISION',
        instance: new OpenAIModerator(process.env.OPENAI_API_KEY),
        priority: 3
      });
    }

    // Sort by priority
    this.providers.sort((a, b) => a.priority - b.priority);

    if (this.providers.length === 0) {
      console.warn('WARNING: No AI moderation providers configured. Image moderation will be limited.');
    }
  }

  /**
   * Moderate an image using available providers (with fallback)
   * @param {Buffer} imageBuffer - Image buffer to moderate
   * @returns {Object} - Moderation result
   */
  async moderateImage(imageBuffer) {
    if (this.providers.length === 0) {
      // Fallback: manual review required
      return {
        scores: { adult: 0.5, violence: 0.5, racy: 0.5 },
        labels: [],
        provider: 'NONE',
        decision: 'MANUAL_REVIEW_REQUIRED',
        reason: 'No AI provider configured'
      };
    }

    // Try each provider in order
    for (const provider of this.providers) {
      try {
        const result = await provider.instance.moderate(imageBuffer);
        const decision = this.makeDecision(result.scores);
        
        return {
          ...result,
          decision: decision.decision,
          rejectionReasons: decision.reasons,
          detectedLabels: result.labels
        };

      } catch (error) {
        console.error(`${provider.name} failed:`, error.message);
        // Try next provider
        continue;
      }
    }

    // All providers failed - require manual review
    return {
      scores: {},
      labels: [],
      provider: 'FAILED',
      decision: 'MANUAL_REVIEW_REQUIRED',
      reason: 'All AI providers failed',
      error: 'Moderation service unavailable'
    };
  }

  /**
   * Make moderation decision based on scores
   * @param {Object} scores - AI scores
   * @returns {Object} - Decision and reasons
   */
  makeDecision(scores) {
    const reasons = [];
    let requiresReview = false;
    let autoReject = false;

    // Check each score against thresholds
    for (const [key, value] of Object.entries(scores)) {
      if (THRESHOLDS.UNSAFE[key] && value >= THRESHOLDS.UNSAFE[key]) {
        autoReject = true;
        reasons.push(this.getReasonFromKey(key));
      } else if (THRESHOLDS.SAFE[key] && value > THRESHOLDS.SAFE[key]) {
        requiresReview = true;
      }
    }

    let decision;
    if (autoReject) {
      decision = 'AUTO_REJECTED';
    } else if (requiresReview) {
      decision = 'MANUAL_REVIEW_REQUIRED';
    } else {
      decision = 'AUTO_APPROVED';
    }

    return { decision, reasons };
  }

  getReasonFromKey(key) {
    const mapping = {
      adult: 'INAPPROPRIATE',
      nudity: 'NUDITY',
      explicitNudity: 'PORNOGRAPHY',
      violence: 'VIOLENCE',
      suggestive: 'INAPPROPRIATE',
      drugs: 'DRUGS',
      weapons: 'WEAPONS',
      hate: 'HATE_SYMBOLS',
      spoof: 'MISLEADING',
      gambling: 'INAPPROPRIATE'
    };
    return mapping[key] || 'INAPPROPRIATE';
  }

  /**
   * Check category relevance (basic implementation)
   * @param {Array} labels - Detected labels
   * @param {String} category - Item category
   * @returns {Number} - Relevance score 0-1
   */
  checkCategoryRelevance(labels, category) {
    const categoryKeywords = {
      'Electronics': ['phone', 'laptop', 'computer', 'device', 'electronics', 'screen', 'gadget'],
      'Books': ['book', 'textbook', 'novel', 'magazine', 'paper', 'reading'],
      'Furniture': ['furniture', 'chair', 'table', 'bed', 'desk', 'sofa', 'shelf'],
      'Clothing': ['clothing', 'shirt', 'pants', 'dress', 'fashion', 'apparel', 'wear'],
      'Sports': ['sports', 'ball', 'equipment', 'athletic', 'fitness', 'exercise'],
      'Vehicle': ['car', 'bike', 'bicycle', 'motorcycle', 'vehicle', 'wheel', 'transport'],
      'Property': ['house', 'building', 'room', 'apartment', 'property', 'real estate', 'interior']
    };

    const keywords = categoryKeywords[category] || [];
    if (keywords.length === 0) return 0.5; // Unknown category

    const matches = labels.filter(label => 
      keywords.some(keyword => label.toLowerCase().includes(keyword))
    );

    return Math.min(1, matches.length / 3); // At least 3 matches = fully relevant
  }
}

// Export singleton instance
export default new ModerationService();

// Export classes for testing
export { GoogleVisionModerator, AWSRekognitionModerator, OpenAIModerator, THRESHOLDS };
