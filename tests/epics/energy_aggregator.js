// energy_aggregator.js
import { calculateBasalMetabolicRate } from "./energy/basal-metabolic-rate.js";
import { calculateThermicEffectFood } from "./energy/thermic-effect-food.js";
import { calculatePhysicalActivityEnergyExpenditure } from "./energy/physical-activity-energy-expenditure.js";
import { calculateEnergyCapacity } from "./energy/energy-capacity.js";
import { calculateRecoveryScore } from "./energy/recovery-score.js";
import { calculateHRVScore } from "./energy/hrv-score.js";
import { calculateEnergyCreditScore } from "./energy/energy-credit-score.js";
import { calculateEnergySafeZone } from "./energy/energy-safe-zone.js";

function round2(n) { return Number(n.toFixed(2)); }

/**
 * Calculate comprehensive energy metrics based on multiple physiological and activity measurements
 * 
 * This function analyzes various aspects of energy metabolism including basal metabolic rate,
 * thermic effect of food, physical activity expenditure, energy capacity, recovery metrics,
 * HRV analysis, energy credit scoring, and safe zone recommendations.
 * 
 * @param {Object} values - Energy data and biometric measurements
 * @param {number} values.weight - Weight in kg
 * @param {number} values.height - Height in cm
 * @param {number} values.age - Age in years
 * @param {string} values.gender - Gender ('male' or 'female')
 * @param {number} values.sleepScore - Sleep score (0-100)
 * @param {number} values.stressScore - Stress score (0-100)
 * @param {number} values.timeOfDay - Hour of day (0-23)
 * @param {number} values.totalCalorieIntake - Total daily caloric intake
 * @param {number} values.proteinKcal - Protein calories (optional)
 * @param {number} values.carbKcal - Carbohydrate calories (optional)
 * @param {number} values.fatKcal - Fat calories (optional)
 * @param {number} values.metValue - Metabolic Equivalent of Task value
 * @param {number} values.durationHours - Duration of activity in hours
 * @param {number} values.averageActivityLevel - Average activity level from wearable data (optional)
 * @param {number} values.fitnessScore - Fitness score (0-100, optional)
 * @param {number} values.recoveryScore - Recovery score (0-100, optional)
 * @param {number} values.stressIndex - Stress index (0-100, optional)
 * @param {number} values.vo2Max - Current VO2 max value (optional)
 * @param {number} values.targetVO2Max - Target VO2 max (optional)
 * @param {number} values.bodyFatPercentage - Body fat percentage (optional)
 * @param {number} values.bodyFatLowerBound - Lower bound of optimal range (optional)
 * @param {number} values.bodyFatUpperBound - Upper bound of optimal range (optional)
 * @param {number} values.currentHRV - Today's HRV value in ms
 * @param {number} values.baselineHRV - Personal baseline HRV in ms
 * @param {number} values.acceptableDeviation - Acceptable HRV deviation (optional)
 * @param {string} values.populationType - 'athlete' or 'general' (optional)
 * @param {number} values.currentCreditScore - Yesterday's Total Energy Credit Score (optional)
 * @param {number} values.rollingAvgCreditChanges - Rolling average of past changes (optional)
 * @param {Array} values.historicalEnergyDeltas - Array of past energy deltas (optional)
 * @param {number} values.bufferZone - Buffer zone for safe zone (optional)
 * @returns {Object} Comprehensive energy analysis with all calculated metrics
 */
function energyScore(values) {
  // Extract all energy and biometric data from input
  const {
    // BMR calculation inputs
    weight, height, age, gender, sleepScore, stressScore, timeOfDay,
    
    // TEF calculation inputs
    totalCalorieIntake, proteinKcal, carbKcal, fatKcal,
    
    // PAEE calculation inputs
    metValue, durationHours, averageActivityLevel,
    
    // Energy Capacity calculation inputs
    fitnessScore, recoveryScore, stressIndex,
    vo2Max, targetVO2Max, bodyFatPercentage, bodyFatLowerBound, bodyFatUpperBound,
    
    // HRV Score calculation inputs
    currentHRV, baselineHRV, acceptableDeviation, populationType,
    
    // Energy Credit Score calculation inputs
    currentCreditScore, rollingAvgCreditChanges,
    
    // Energy Safe Zone calculation inputs
    historicalEnergyDeltas, bufferZone
  } = values;

  // === CALCULATE INDIVIDUAL ENERGY METRICS ===
  
  // Basal Metabolic Rate - Foundation of energy expenditure
  const bmr = calculateBasalMetabolicRate(
    weight, height, age, gender,
    sleepScore || 90, stressScore || 50, timeOfDay || 12
  );
  
  // Thermic Effect of Food - Energy cost of digestion
  const tef = calculateThermicEffectFood(
    totalCalorieIntake, proteinKcal, carbKcal, fatKcal
  );
  
  // Physical Activity Energy Expenditure - Activity-related energy cost
  const paee = calculatePhysicalActivityEnergyExpenditure(
    metValue, bmr.value, durationHours, averageActivityLevel
  );
  
  // HRV Score - Heart rate variability analysis
  const hrv = calculateHRVScore(
    currentHRV, baselineHRV, acceptableDeviation, populationType || 'general'
  );
  
  // Recovery Score - Combination of HRV and sleep
  const recovery = calculateRecoveryScore(
    hrv.value, sleepScore || 85, 0.6, 0.4
  );
  
  // Prepare VO2 and body fat data for Energy Capacity
  const vo2Data = vo2Max ? {
    current: vo2Max,
    target: targetVO2Max,
    sigma: 3.0
  } : null;
  
  const bodyFatData = bodyFatPercentage ? {
    percentage: bodyFatPercentage,
    lowerBound: bodyFatLowerBound,
    upperBound: bodyFatUpperBound,
    sigma: 2.5
  } : null;
  
  // Energy Capacity - Maximum sustainable energy output
  const energyCapacity = calculateEnergyCapacity(
    bmr.value,
    fitnessScore,
    recoveryScore || recovery.value,
    stressIndex || stressScore || 50,
    2.0, 1.5, 2.0, // alpha, beta, gamma coefficients
    vo2Data,
    bodyFatData
  );
  
  // Calculate Total Energy Expenditure (TEE)
  const totalEnergyExpenditure = bmr.value + paee.value + tef.value;
  
  // Energy Credit Score - Sustainable energy management scoring
  const energyCredit = calculateEnergyCreditScore(
    energyCapacity.value,
    totalEnergyExpenditure,
    currentCreditScore || 500,
    rollingAvgCreditChanges || 0,
    250, 8, 10, 1000 // maxScalingDelta, surplusGain, deficitPenalty, maxScore
  );
  
  // Energy Safe Zone - Personalized energy balance recommendations
  const safeZone = calculateEnergySafeZone(
    historicalEnergyDeltas || [],
    bufferZone || 50,
    3 // minHistoryRequired
  );

  // === COMPILE COMPREHENSIVE RESULTS ===
  
  const results = {
    // Individual component scores
    bmr: round2(bmr.value),
    tef: round2(tef.value),
    paee: round2(paee.value),
    energyCapacity: round2(energyCapacity.value),
    recovery: round2(recovery.value),
    hrv: round2(hrv.value),
    energyCredit: round2(energyCredit.value),
    
    // Calculated metrics
    totalEnergyExpenditure: round2(totalEnergyExpenditure),
    energyDelta: round2(energyCapacity.value - totalEnergyExpenditure),
    
    // Safe zone bounds (if available)
    safeZoneUpperBound: safeZone.available ? round2(safeZone.upperBound) : null,
    safeZoneLowerBound: safeZone.available ? round2(safeZone.lowerBound) : null,
    
    // Detailed component objects for advanced analysis
    components: {
      bmrDetailed: bmr,
      tefDetailed: tef,
      paeeDetailed: paee,
      energyCapacityDetailed: energyCapacity,
      recoveryDetailed: recovery,
      hrvDetailed: hrv,
      energyCreditDetailed: energyCredit,
      safeZoneDetailed: safeZone
    },
    
    // Energy balance analysis
    analysis: {
      energyBalance: energyCapacity.value - totalEnergyExpenditure > 0 ? 'surplus' : 'deficit',
      sustainabilityScore: round2(energyCredit.value / 10), // 0-100 scale
      recoveryReadiness: recovery.value >= 80 ? 'excellent' : 
                        recovery.value >= 60 ? 'good' : 
                        recovery.value >= 40 ? 'fair' : 'needs attention'
    }
  };

  return results;
}

export { energyScore };

// === Example Usage ===
/*
energyScore({
  // Basic demographics
  weight: 75, height: 175, age: 30, gender: 'male',
  
  // Physiological scores
  sleepScore: 85, stressScore: 45, timeOfDay: 14,
  
  // Nutrition
  totalCalorieIntake: 2300, proteinKcal: 690, carbKcal: 920, fatKcal: 690,
  
  // Activity
  metValue: 1.8, durationHours: 24, averageActivityLevel: 1.2,
  
  // Fitness
  fitnessScore: 78, vo2Max: 45, targetVO2Max: 48,
  bodyFatPercentage: 15, bodyFatLowerBound: 14, bodyFatUpperBound: 17,
  
  // Recovery
  currentHRV: 42, baselineHRV: 45, acceptableDeviation: 20,
  
  // Energy management
  currentCreditScore: 700, rollingAvgCreditChanges: 5.2,
  historicalEnergyDeltas: [25, 45, -15, 30, 55, 10, 35]
});
*/