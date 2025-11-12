// stress_aggregator.js
import { calculateStressScore } from "./stress/stress-score.js";

function round2(n) { return Number(n.toFixed(2)); }

/**
 * Calculate comprehensive stress score (0-100) based on resting heart rate data
 * 
 * This function analyzes stress levels primarily based on Resting Heart Rate (RHR) using
 * parasympathetic scoring. Lower RHR indicates higher parasympathetic activity (less stress),
 * while higher RHR indicates more sympathetic activity (higher stress).
 * 
 * @param {Object} values - Stress data and biometric measurements
 * @param {number|Array} values.heartRateData - Either pre-calculated RHR or array of HR readings from last 30 minutes
 * @param {number} values.totalStepsLast30Min - Total steps taken in last 30 minutes (for RHR calculation)
 * @param {number} values.muRHR - Baseline RHR value (default 100 bpm)
 * @param {number} values.sigmaRHR - Tolerance/sigma for RHR calculation (default 15 bpm)
 * @param {number} values.fallbackRHR - Fallback RHR if calculation not possible (default 70 bpm)
 * @param {number} values.energyCapacity - Energy capacity for stress-energy conversion (optional)
 * @param {number} values.paee - Physical Activity Energy Expenditure (optional)
 * @param {number} values.tef - Thermic Effect of Food (optional)
 * @param {number} values.averageMonthlyStress - Average stress over last month for energy rate calculation (optional)
 * @returns {Object} Comprehensive stress analysis with all calculated metrics
 */
function stressScore(values) {
  // Extract all stress and biometric data from input
  const {
    // Primary stress calculation inputs
    heartRateData, totalStepsLast30Min, muRHR, sigmaRHR, fallbackRHR,
    
    // Optional stress-energy conversion inputs
    energyCapacity, paee, tef, averageMonthlyStress
  } = values;

  // === CALCULATE PRIMARY STRESS METRICS ===
  
  // Main Stress Score - Based on RHR and parasympathetic scoring
  const mainStressScore = calculateStressScore(
    heartRateData,
    totalStepsLast30Min || 0,
    muRHR || 100,
    sigmaRHR || 15,
    fallbackRHR || 70
  );

  // === CALCULATE OPTIONAL STRESS-ENERGY CONVERSION ===
  
  let stressEnergyConversion = null;
  
  if (energyCapacity && paee !== undefined && tef !== undefined) {
    // Energy_Surplus = |Energy Capacity - PAEE (movement/activity energy cost) - TEF (digestive energy cost)|
    const energySurplus = Math.abs(energyCapacity - paee - tef);
    
    // Overall_Stress is AVG stress for the whole day (use monthly average if provided, otherwise current)
    const overallStress = averageMonthlyStress !== undefined ? averageMonthlyStress : mainStressScore.value;
    
    // Stress_Energy_Rate = Average(Energy_Surplus/(100 - Overall_Stress))
    // Note: This should be averaged over the last month, but using single calculation here
    const stressEnergyRate = overallStress >= 100 ? 0 : energySurplus / (100 - overallStress);
    
    // Stress_Energy = (100 - Overall_Stress) x Stress_Energy_Rate
    const stressEnergy = (100 - overallStress) * stressEnergyRate;
    
    stressEnergyConversion = {
      energySurplus: round2(energySurplus),
      stressEnergyRate: round2(stressEnergyRate),
      stressEnergy: round2(stressEnergy),
      overallStress: round2(overallStress),
      inputs: {
        energyCapacity,
        paee,
        tef,
        averageMonthlyStress,
        currentStress: mainStressScore.value
      },
      formula: {
        energySurplus: `|${energyCapacity} - ${paee} - ${tef}| = ${round2(energySurplus)}`,
        stressEnergyRate: `${round2(energySurplus)} / (100 - ${round2(overallStress)}) = ${round2(stressEnergyRate)}`,
        stressEnergy: `(100 - ${round2(overallStress)}) × ${round2(stressEnergyRate)} = ${round2(stressEnergy)}`
      }
    };
  }

  // === COMPILE COMPREHENSIVE RESULTS ===
  
  const results = {
    // Primary stress score
    stressScore: round2(mainStressScore.value),
    
    // Component breakdown
    rhr: round2(mainStressScore.components.rhr.value),
    parasympatheticScore: round2(mainStressScore.components.parasympathetic.value),
    
    // Optional stress-energy metrics
    stressEnergyConversion,
    
    // Detailed component objects for advanced analysis
    components: {
      stressScoreDetailed: mainStressScore,
      rhrDetailed: mainStressScore.components.rhr,
      parasympatheticDetailed: mainStressScore.components.parasympathetic,
      stressEnergyDetailed: stressEnergyConversion
    },
    
    // Stress level analysis
    analysis: {
      stressLevel: mainStressScore.value >= 80 ? 'low stress' : 
                  mainStressScore.value >= 60 ? 'moderate stress' : 
                  mainStressScore.value >= 40 ? 'elevated stress' : 'high stress',
      parasympatheticActivity: mainStressScore.components.parasympathetic.value >= 80 ? 'very high' : 
                              mainStressScore.components.parasympathetic.value >= 60 ? 'high' : 
                              mainStressScore.components.parasympathetic.value >= 40 ? 'moderate' : 'low',
      rhrStatus: mainStressScore.components.rhr.value <= 60 ? 'excellent' : 
                 mainStressScore.components.rhr.value <= 70 ? 'good' : 
                 mainStressScore.components.rhr.value <= 80 ? 'average' : 'elevated',
      isAtRest: mainStressScore.components.rhr.components.isAtRest
    }
  };

  return results;
}

export { stressScore };

// === Example Usage ===
/*
stressScore({
  // Option 1: Provide pre-calculated RHR
  heartRateData: 68,
  totalStepsLast30Min: 150,
  
  // Option 2: Provide heart rate readings for RHR calculation
  // heartRateData: [65, 67, 69, 66, 68, 70, 64],
  // totalStepsLast30Min: 240,
  
  // RHR calculation parameters
  muRHR: 100,
  sigmaRHR: 15,
  fallbackRHR: 70,
  
  // Optional: For stress-energy conversion
  energyCapacity: 2500,
  paee: 400,
  tef: 230,
  averageMonthlyStress: 65
});
*/