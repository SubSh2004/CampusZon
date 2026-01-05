/**
 * Search utilities for fuzzy matching and suggestions
 */

interface Item {
  title: string;
  description: string;
  category: string;
}

/**
 * Calculate similarity score between two strings (0-1)
 * Uses a simple character matching algorithm
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Contains match (higher priority)
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Word-level matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchCount = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2) {
        matchCount++;
      } else if (word1.includes(word2) || word2.includes(word1)) {
        matchCount += 0.5;
      }
    }
  }
  
  const maxWords = Math.max(words1.length, words2.length);
  const wordScore = maxWords > 0 ? matchCount / maxWords : 0;
  
  // Character-level similarity (Levenshtein-inspired)
  const charScore = characterSimilarity(s1, s2);
  
  // Weighted average
  return wordScore * 0.7 + charScore * 0.3;
}

/**
 * Character-level similarity
 */
function characterSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer[i] === shorter[i]) matches++;
  }
  
  return matches / longer.length;
}

/**
 * Fuzzy search that finds items matching the query
 * Returns items sorted by relevance
 */
export function fuzzySearch(items: Item[], query: string, threshold: number = 0.3): Item[] {
  if (!query.trim()) return items;
  
  const scoredItems = items.map(item => {
    // Calculate similarity for title, description, and category
    const titleScore = calculateSimilarity(item.title, query) * 3; // Title weight: 3x
    const descScore = calculateSimilarity(item.description, query) * 1.5; // Description weight: 1.5x
    const categoryScore = calculateSimilarity(item.category, query) * 2; // Category weight: 2x
    
    // Check for partial word matches in description
    const words = query.toLowerCase().split(/\s+/);
    let partialMatchBonus = 0;
    for (const word of words) {
      if (item.title.toLowerCase().includes(word)) partialMatchBonus += 0.3;
      if (item.description.toLowerCase().includes(word)) partialMatchBonus += 0.15;
      if (item.category.toLowerCase().includes(word)) partialMatchBonus += 0.2;
    }
    
    const totalScore = titleScore + descScore + categoryScore + partialMatchBonus;
    
    return {
      item,
      score: totalScore
    };
  });
  
  // Filter by threshold and sort by score
  return scoredItems
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

/**
 * Generate search suggestions based on existing items
 */
export function generateSuggestions(items: Item[], query: string, maxSuggestions: number = 8): string[] {
  if (!query.trim()) return [];
  
  const queryLower = query.toLowerCase();
  const suggestions = new Set<string>();
  
  console.log(`Generating suggestions for query: "${query}" from ${items.length} items`);
  
  // Extract keywords from titles and descriptions
  items.forEach(item => {
    const title = item.title.toLowerCase();
    const description = item.description.toLowerCase();
    const category = item.category.toLowerCase();
    
    // Add exact matches and partial matches from titles
    if (title.includes(queryLower)) {
      suggestions.add(item.title);
      console.log(`Added title: ${item.title}`);
    }
    
    // Add category if it matches
    if (category.includes(queryLower)) {
      suggestions.add(item.category);
      console.log(`Added category: ${item.category}`);
    }
    
    // Extract multi-word phrases from titles that contain the query
    const titleWords = item.title.split(/\s+/);
    for (let i = 0; i < titleWords.length; i++) {
      if (titleWords[i].toLowerCase().includes(queryLower)) {
        // Add single word
        suggestions.add(titleWords[i]);
        
        // Add 2-word phrase
        if (i < titleWords.length - 1) {
          suggestions.add(`${titleWords[i]} ${titleWords[i + 1]}`);
        }
        // Add 3-word phrase
        if (i < titleWords.length - 2) {
          suggestions.add(`${titleWords[i]} ${titleWords[i + 1]} ${titleWords[i + 2]}`);
        }
      }
    }
    
    // Extract keywords from description
    const descWords = description.split(/\s+/);
    descWords.forEach(word => {
      if (word.length > 2 && word.includes(queryLower)) {
        suggestions.add(word);
      }
    });
  });
  
  console.log(`Total suggestions before scoring: ${suggestions.size}`);
  
  // Convert to array and score by relevance
  const scoredSuggestions = Array.from(suggestions).map(suggestion => ({
    text: suggestion,
    score: calculateSimilarity(suggestion, query)
  }));
  
  // Sort by score and return top suggestions
  const result = scoredSuggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .map(s => s.text);
  
  console.log(`Final suggestions (${result.length}):`, result);
  
  return result;
}

/**
 * Common search keywords and synonyms for better matching
 */
export const SEARCH_SYNONYMS: Record<string, string[]> = {
  'laptop': ['computer', 'notebook', 'macbook', 'dell', 'hp', 'lenovo'],
  'phone': ['mobile', 'smartphone', 'iphone', 'android', 'samsung'],
  'book': ['textbook', 'novel', 'guide', 'manual', 'ebook'],
  'bike': ['bicycle', 'cycle', 'two wheeler'],
  'furniture': ['table', 'chair', 'desk', 'bed', 'sofa', 'shelf'],
  'sports': ['basketball', 'football', 'cricket', 'badminton', 'tennis'],
  'electronics': ['laptop', 'phone', 'tablet', 'headphones', 'speakers'],
  'clothing': ['shirt', 'pants', 'dress', 'jeans', 'jacket'],
};

/**
 * Expand query with synonyms
 */
export function expandQueryWithSynonyms(query: string): string[] {
  const queryLower = query.toLowerCase().trim();
  const expanded = [queryLower];
  
  for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
    if (queryLower.includes(key)) {
      expanded.push(...synonyms);
    }
    for (const synonym of synonyms) {
      if (queryLower.includes(synonym)) {
        expanded.push(key, ...synonyms.filter(s => s !== synonym));
      }
    }
  }
  
  return [...new Set(expanded)];
}
