/**
 * Strike and Enforcement System
 * Manages user violations, penalties, and account enforcement
 */

import UserViolation from '../models/userViolation.model.js';
import ModerationAuditLog from '../models/moderationAuditLog.model.js';
import ImageModeration from '../models/imageModeration.model.js';

/**
 * Violation severity levels and corresponding strike counts
 */
const SEVERITY_STRIKES = {
  LOW: 0.5,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3
};

/**
 * Enforcement actions based on strike count
 */
const ENFORCEMENT_THRESHOLDS = {
  WARNING: 1,           // 1 strike = warning
  TEMP_SUSPENSION_1: 2, // 2 strikes = 24h suspension
  TEMP_SUSPENSION_2: 3, // 3 strikes = 7 day suspension
  PERMANENT_BAN: 4      // 4+ strikes = permanent ban
};

/**
 * Suspension durations (in milliseconds)
 */
const SUSPENSION_DURATION = {
  FIRST: 24 * 60 * 60 * 1000,      // 24 hours
  SECOND: 7 * 24 * 60 * 60 * 1000,  // 7 days
  THIRD: 30 * 24 * 60 * 60 * 1000   // 30 days
};

/**
 * Determine severity based on violation type
 */
function determineSeverity(violationType, aiScores) {
  const criticalTypes = ['PORNOGRAPHY', 'GORE', 'HATE_SYMBOLS'];
  const highTypes = ['NUDITY', 'VIOLENCE', 'WEAPONS', 'DRUGS'];
  const mediumTypes = ['SPAM', 'MISLEADING', 'INAPPROPRIATE'];
  
  if (criticalTypes.includes(violationType)) return 'CRITICAL';
  if (highTypes.includes(violationType)) return 'HIGH';
  if (mediumTypes.includes(violationType)) return 'MEDIUM';
  
  // Check AI scores for severity
  if (aiScores) {
    const maxScore = Math.max(...Object.values(aiScores).filter(v => typeof v === 'number'));
    if (maxScore > 0.9) return 'CRITICAL';
    if (maxScore > 0.7) return 'HIGH';
    if (maxScore > 0.5) return 'MEDIUM';
  }
  
  return 'LOW';
}

/**
 * Record a violation for a user
 * @param {Object} options - Violation details
 * @returns {Object} - Enforcement action taken
 */
export async function recordViolation(options) {
  const {
    userId,
    imageId,
    itemId,
    violationType,
    aiScores,
    description,
    actedBy = 'SYSTEM'
  } = options;

  try {
    // Get or create user violation record
    let userViolation = await UserViolation.findOne({ userId });
    
    if (!userViolation) {
      userViolation = await UserViolation.create({
        userId,
        totalViolations: 0,
        activeStrikes: 0,
        lifetimeStrikes: 0,
        accountStatus: 'ACTIVE',
        violations: [],
        warnings: [],
        stats: {
          totalImagesUploaded: 0,
          imagesRejected: 0,
          imagesReported: 0,
          rejectionRate: 0
        }
      });
    }

    // Determine severity
    const severity = determineSeverity(violationType, aiScores);
    const strikesAdded = SEVERITY_STRIKES[severity];

    // Update strikes
    const newActiveStrikes = userViolation.activeStrikes + strikesAdded;
    const newLifetimeStrikes = userViolation.lifetimeStrikes + strikesAdded;

    // Determine enforcement action
    const enforcement = determineEnforcementAction(newActiveStrikes, userViolation);

    // Create violation record
    const violation = {
      imageId,
      itemId,
      violationType,
      severity,
      action: enforcement.action,
      description: description || `Violation: ${violationType}`,
      detectedAt: new Date(),
      actedBy,
      strikesAdded
    };

    // Update user violation record
    userViolation.violations.push(violation);
    userViolation.totalViolations += 1;
    userViolation.activeStrikes = newActiveStrikes;
    userViolation.lifetimeStrikes = newLifetimeStrikes;
    userViolation.accountStatus = enforcement.accountStatus;
    userViolation.stats.imagesRejected += 1;
    userViolation.stats.lastViolationDate = new Date();
    userViolation.goodBehaviorDays = 0; // Reset good behavior counter

    // Apply enforcement action
    if (enforcement.action === 'WARNING') {
      userViolation.warnings.push({
        sentAt: new Date(),
        reason: `${violationType} - ${severity} severity`,
        acknowledged: false
      });
    } else if (enforcement.action.includes('SUSPENSION')) {
      userViolation.suspendedUntil = enforcement.suspendedUntil;
      userViolation.suspensionReason = `${violationType} violation (${newActiveStrikes} strikes)`;
    } else if (enforcement.action === 'PERMANENT_BAN') {
      userViolation.permanentlyBanned = true;
      userViolation.banReason = `Multiple violations (${newLifetimeStrikes} total strikes)`;
      userViolation.bannedAt = new Date();
    }

    // Calculate rejection rate
    if (userViolation.stats.totalImagesUploaded > 0) {
      userViolation.stats.rejectionRate = 
        (userViolation.stats.imagesRejected / userViolation.stats.totalImagesUploaded) * 100;
    }

    await userViolation.save();

    // Create audit log
    await ModerationAuditLog.create({
      action: enforcement.auditAction,
      imageId,
      itemId,
      userId,
      actorType: actedBy === 'SYSTEM' ? 'SYSTEM' : 'ADMIN',
      actorId: actedBy,
      details: {
        violationType,
        severity,
        strikesAdded,
        totalStrikes: newActiveStrikes,
        enforcementAction: enforcement.action,
        reason: description
      }
    });

    console.log(`Violation recorded for user ${userId}: ${violationType} (${severity}) - ${enforcement.action}`);

    return {
      success: true,
      enforcement,
      strikes: {
        added: strikesAdded,
        active: newActiveStrikes,
        lifetime: newLifetimeStrikes
      },
      userStatus: enforcement.accountStatus
    };

  } catch (error) {
    console.error('Error recording violation:', error);
    throw error;
  }
}

/**
 * Determine what enforcement action to take
 */
function determineEnforcementAction(activeStrikes, userViolation) {
  const suspensionCount = userViolation.violations.filter(v => 
    v.action.includes('SUSPENSION')
  ).length;

  if (activeStrikes >= ENFORCEMENT_THRESHOLDS.PERMANENT_BAN) {
    return {
      action: 'PERMANENT_BAN',
      accountStatus: 'BANNED',
      auditAction: 'USER_BANNED',
      message: 'Account permanently banned due to repeated violations'
    };
  } else if (activeStrikes >= ENFORCEMENT_THRESHOLDS.TEMP_SUSPENSION_2) {
    const duration = suspensionCount === 0 ? SUSPENSION_DURATION.FIRST :
                     suspensionCount === 1 ? SUSPENSION_DURATION.SECOND :
                     SUSPENSION_DURATION.THIRD;
    return {
      action: 'TEMPORARY_SUSPENSION',
      accountStatus: 'SUSPENDED',
      auditAction: 'USER_SUSPENDED',
      suspendedUntil: new Date(Date.now() + duration),
      message: `Account suspended for ${duration / (24 * 60 * 60 * 1000)} days`
    };
  } else if (activeStrikes >= ENFORCEMENT_THRESHOLDS.TEMP_SUSPENSION_1) {
    return {
      action: 'TEMPORARY_SUSPENSION',
      accountStatus: 'SUSPENDED',
      auditAction: 'USER_SUSPENDED',
      suspendedUntil: new Date(Date.now() + SUSPENSION_DURATION.FIRST),
      message: 'Account suspended for 24 hours'
    };
  } else if (activeStrikes >= ENFORCEMENT_THRESHOLDS.WARNING) {
    return {
      action: 'WARNING',
      accountStatus: 'WARNING',
      auditAction: 'USER_WARNED',
      message: 'Warning issued - further violations will result in suspension'
    };
  } else {
    return {
      action: 'IMAGE_REMOVED',
      accountStatus: 'ACTIVE',
      auditAction: 'IMAGE_REMOVED',
      message: 'Image removed'
    };
  }
}

/**
 * Check if user is allowed to upload images
 * @param {String} userId - User ID
 * @returns {Object} - { allowed: boolean, reason: string }
 */
export async function checkUserCanUpload(userId) {
  try {
    const userViolation = await UserViolation.findOne({ userId });

    if (!userViolation) {
      return { allowed: true };
    }

    // Check if permanently banned
    if (userViolation.permanentlyBanned) {
      return {
        allowed: false,
        reason: 'Account permanently banned for violations',
        banReason: userViolation.banReason
      };
    }

    // Check if currently suspended
    if (userViolation.accountStatus === 'SUSPENDED') {
      if (userViolation.suspendedUntil && userViolation.suspendedUntil > new Date()) {
        return {
          allowed: false,
          reason: 'Account temporarily suspended',
          suspendedUntil: userViolation.suspendedUntil,
          suspensionReason: userViolation.suspensionReason
        };
      } else {
        // Suspension expired - lift it
        userViolation.accountStatus = userViolation.activeStrikes > 0 ? 'WARNING' : 'ACTIVE';
        await userViolation.save();
      }
    }

    return { allowed: true };

  } catch (error) {
    console.error('Error checking user upload permission:', error);
    // Allow by default on error
    return { allowed: true };
  }
}

/**
 * Reduce strikes for good behavior (run periodically)
 * @param {String} userId - User ID
 */
export async function reduceStrikesForGoodBehavior(userId) {
  try {
    const userViolation = await UserViolation.findOne({ userId });
    
    if (!userViolation || userViolation.activeStrikes === 0) {
      return;
    }

    const daysSinceLastViolation = userViolation.stats.lastViolationDate
      ? Math.floor((Date.now() - userViolation.stats.lastViolationDate) / (24 * 60 * 60 * 1000))
      : 0;

    // Reduce 0.5 strikes every 30 days of good behavior
    if (daysSinceLastViolation >= 30) {
      const reductionCycles = Math.floor(daysSinceLastViolation / 30);
      const strikeReduction = Math.min(
        reductionCycles * 0.5,
        userViolation.activeStrikes
      );

      userViolation.activeStrikes = Math.max(0, userViolation.activeStrikes - strikeReduction);
      userViolation.goodBehaviorDays = daysSinceLastViolation;
      
      if (userViolation.activeStrikes === 0) {
        userViolation.accountStatus = 'ACTIVE';
      }

      await userViolation.save();

      console.log(`Reduced strikes for user ${userId}: -${strikeReduction} strikes (good behavior: ${daysSinceLastViolation} days)`);
    }

  } catch (error) {
    console.error('Error reducing strikes:', error);
  }
}

/**
 * Get user violation statistics
 * @param {String} userId - User ID
 * @returns {Object} - Violation stats
 */
export async function getUserViolationStats(userId) {
  try {
    const userViolation = await UserViolation.findOne({ userId });
    
    if (!userViolation) {
      return {
        hasViolations: false,
        activeStrikes: 0,
        accountStatus: 'ACTIVE'
      };
    }

    return {
      hasViolations: true,
      activeStrikes: userViolation.activeStrikes,
      lifetimeStrikes: userViolation.lifetimeStrikes,
      totalViolations: userViolation.totalViolations,
      accountStatus: userViolation.accountStatus,
      permanentlyBanned: userViolation.permanentlyBanned,
      suspendedUntil: userViolation.suspendedUntil,
      stats: userViolation.stats,
      recentViolations: userViolation.violations.slice(-5).reverse()
    };

  } catch (error) {
    console.error('Error getting violation stats:', error);
    return {
      hasViolations: false,
      activeStrikes: 0,
      accountStatus: 'ACTIVE',
      error: error.message
    };
  }
}

export default {
  recordViolation,
  checkUserCanUpload,
  reduceStrikesForGoodBehavior,
  getUserViolationStats
};
