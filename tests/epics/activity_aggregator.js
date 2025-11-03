// activity_aggregator.js
import { calculateStepsScore } from "./activity/steps-score.js";
import { calculateActiveMinutesScore } from "./activity/active-minutes-score.js";
import { calculateConsistencyScore } from "./activity/consistency-score.js";
import { calculateActivityLevelConsistencyScore } from "./activity/activity-level-consistency.js";
import { calculateTotalEnergyCreditScore } from "./activity/total-energy-credit-score.js";
import { calculateFinalActivityScore } from "./activity/final-activity-score.js";

function round2(n) { return Number(n.toFixed(2)); }

/**
 * Calculate comprehensive activity score (0-100) based on multiple activity metrics
 * 
 * This function analyzes various aspects of physical activity including steps taken,
 * active minutes, consistency patterns, activity level distribution, energy credit scoring,
 * and calculates a final weighted activity score following the OneVital specification.
 * 
 * @param {Object} values - Activity data and biometric measurements
 * @param {number} values.stepsTodayX - Steps taken today
 * @param {number} values.baselineStepsMu - Personal baseline steps (mean)
 * @param {number} values.steps7dStdDev - 7-day standard deviation of steps
 * @param {number} values.steps7dMean - 7-day mean of steps
 * @param {Array} values.steps7dArray - Array of last 7 days step counts (optional)
 * @param {number} values.mvpaMinutesToday_m - MVPA minutes today
 * @param {number} values.mvpaRecentMean - Recent mean MVPA minutes
 * @param {number} values.mvpaMinRecommendedByAge - Recommended MVPA minutes by age
 * @param {string} values.ageGroup - Age group classification
 * @param {Array} values.stepsBins - Steps distribution bins for Gini calculation (optional)
 * @param {number} values.giniMeanStepsPerBin - Pre-calculated Gini coefficient (optional)
 * @param {number} values.energyCreditCurrentScore - Current energy credit score
 * @param {number} values.energyCreditRollingAvg - Rolling average of energy credit changes
 * @returns {Object} Comprehensive activity analysis with all calculated metrics
 */
function activityScore(values) {
  // Extract all activity and biometric data from input
  const {
    // Steps Score calculation inputs
    stepsTodayX, baselineStepsMu, steps7dStdDev, steps7dMean, steps7dArray,
    
    // Active Minutes Score calculation inputs
    mvpaMinutesToday_m, mvpaRecentMean, mvpaMinRecommendedByAge, ageGroup,
    
    // Consistency Score calculation inputs (uses steps data)
    // steps7dArray, steps7dMean, steps7dStdDev (already extracted above)
    
    // Activity Level Consistency calculation inputs
    stepsBins, giniMeanStepsPerBin,
    
    // Total Energy Credit Score calculation inputs
    energyCreditCurrentScore, energyCreditRollingAvg
  } = values;

  // === CALCULATE INDIVIDUAL ACTIVITY METRICS (0-100 each) ===
  
  // Steps Score - Gaussian curve based on personal baseline and recent variation
  const stepsScore = calculateStepsScore(
    stepsTodayX,
    baselineStepsMu,
    steps7dStdDev,
    steps7dMean
  );
  
  // Active Minutes Score - MVPA performance relative to recommendations and recent activity
  const activeMinutesScore = calculateActiveMinutesScore(
    mvpaMinutesToday_m,
    mvpaRecentMean,
    mvpaMinRecommendedByAge,
    ageGroup
  );
  
  // Consistency Score - Day-to-day variation in step count (lower variation = higher score)
  const consistencyScore = calculateConsistencyScore(
    steps7dArray,
    steps7dMean,
    steps7dStdDev
  );
  
  // Activity Level Consistency - Gini coefficient of activity distribution throughout the day
  const activityLevelConsistencyScore = calculateActivityLevelConsistencyScore(
    stepsBins,
    giniMeanStepsPerBin
  );
  
  // Total Energy Credit Score - Simple sum of current score and rolling average
  const totalEnergyCreditScore = calculateTotalEnergyCreditScore(
    energyCreditCurrentScore,
    energyCreditRollingAvg
  );
  
  // Final Activity Score - Weighted combination of all component scores
  const finalActivityScore = calculateFinalActivityScore(
    stepsScore.value,
    activeMinutesScore.value,
    consistencyScore.value,
    activityLevelConsistencyScore.value,
    totalEnergyCreditScore.value
  );

  // === COMPILE COMPREHENSIVE RESULTS ===
  
  const results = {
    // Individual component scores
    stepsScore: round2(stepsScore.value),
    activeMinutesScore: round2(activeMinutesScore.value),
    consistencyScore: round2(consistencyScore.value),
    activityLevelConsistencyScore: round2(activityLevelConsistencyScore.value),
    totalEnergyCreditScore: round2(totalEnergyCreditScore.value),
    finalActivityScore: round2(finalActivityScore.value),
    
    // Detailed component objects for advanced analysis
    components: {
      stepsScoreDetailed: stepsScore,
      activeMinutesScoreDetailed: activeMinutesScore,
      consistencyScoreDetailed: consistencyScore,
      activityLevelConsistencyScoreDetailed: activityLevelConsistencyScore,
      totalEnergyCreditScoreDetailed: totalEnergyCreditScore,
      finalActivityScoreDetailed: finalActivityScore
    },
    
    // Activity performance analysis
    analysis: {
      stepsPerformance: stepsScore.value >= 80 ? 'excellent' : 
                       stepsScore.value >= 60 ? 'good' : 
                       stepsScore.value >= 40 ? 'fair' : 'needs improvement',
      mvpaPerformance: activeMinutesScore.value >= 80 ? 'excellent' : 
                      activeMinutesScore.value >= 60 ? 'good' : 
                      activeMinutesScore.value >= 40 ? 'fair' : 'needs improvement',
      consistencyLevel: consistencyScore.value >= 80 ? 'very consistent' : 
                       consistencyScore.value >= 60 ? 'moderately consistent' : 
                       consistencyScore.value >= 40 ? 'somewhat inconsistent' : 'highly variable',
      overallActivityLevel: finalActivityScore.value >= 80 ? 'excellent' : 
                           finalActivityScore.value >= 60 ? 'good' : 
                           finalActivityScore.value >= 40 ? 'fair' : 'needs attention'
    }
  };

  return results;
}

export { activityScore };

// === Example Usage ===
/*
activityScore({
  // Steps data
  stepsTodayX: 8500,
  baselineStepsMu: 7800,
  steps7dStdDev: 1200,
  steps7dMean: 8100,
  steps7dArray: [7500, 8200, 8900, 7800, 8400, 8100, 8500],
  
  // MVPA data
  mvpaMinutesToday_m: 35,
  mvpaRecentMean: 32,
  mvpaMinRecommendedByAge: 30,
  ageGroup: '30-39',
  
  // Activity distribution
  stepsBins: [120, 140, 160, 180, 200, 190, 170, 150, 140, 120, 100, 90],
  giniMeanStepsPerBin: 0.25,
  
  // Energy credit
  energyCreditCurrentScore: 750,
  energyCreditRollingAvg: 25
});
*/