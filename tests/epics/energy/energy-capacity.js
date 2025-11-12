/**
 * Energy Capacity Calculation
 *
 * EnergyCapacity = BMR × CapacityMultiplier
 *
 * CapacityMultiplier = 1.5 + α × FitnessScore + β × RecoveryScore - γ × StressIndex
 * CapacityMultiplier = min(max(CapacityMultiplier, 1.0), 5.0)
 *
 * Typical coefficient values: α = 2.0, β = 1.5, γ = 2.0
 */

import {sleep} from "../../utils/async-helper.js";
import {calculateBasalMetabolicRate} from "./basal-metabolic-rate.js";
import {calculateHRVScore} from "./hrv-score.js";
import {calculateRecoveryScore} from "./recovery-score.js";

/**
 * Calculate VO2 max-based fitness score using Gaussian distribution
 * @param {number} vo2Max - Current VO2 max value
 * @param {number} targetVO2Max - Target VO2 max based on age/sex
 * @param {number} vo2Sigma - Acceptable shortfall (default 3.0)
 * @returns {number} Fitness score (0-100)
 */
function calculateVO2FitnessScore(vo2Max, targetVO2Max, vo2Sigma = 3.0) {
    if (vo2Max >= targetVO2Max) {
        return 100;
    } else {
        // FS_vo2 = 100 × e^(-(T - x)^2 / (2 × σ_vo2^2))
        return 100 * Math.exp(-Math.pow(targetVO2Max - vo2Max, 2) / (2 * Math.pow(vo2Sigma, 2)));
    }
}

/**
 * Calculate Body Fat percentage-based fitness score (fallback)
 * @param {number} bodyFatPercentage - Current body fat percentage
 * @param {number} lowerBound - Lower bound of optimal range
 * @param {number} upperBound - Upper bound of optimal range
 * @param {number} bfSigma - Acceptable deviation (default 2.5)
 * @returns {number} Fitness score (0-100)
 */
function calculateBodyFatFitnessScore(bodyFatPercentage, lowerBound, upperBound, bfSigma = 2.5) {
    if (bodyFatPercentage >= lowerBound && bodyFatPercentage <= upperBound) {
        return 100;
    } else {
        let deviation;
        if (bodyFatPercentage < lowerBound) {
            deviation = lowerBound - bodyFatPercentage;
        } else {
            deviation = bodyFatPercentage - upperBound;
        }
        // FS_bf = 100 × e^(-d^2 / (2 × σ_bf^2))
        return 100 * Math.exp(-Math.pow(deviation, 2) / (2 * Math.pow(bfSigma, 2)));
    }
}

/**
 * Get target VO2 max based on age and gender using "Good" values from charts
 * @param {number} age - Age in years
 * @param {string} gender - 'male' or 'female'
 * @returns {number} Target VO2 max value
 */
function getTargetVO2Max(age, gender) {
    // Using "Good" values from VO2 max charts
    if (gender.toLowerCase() === 'male') {
        if (age <= 29) return 44; // Good range: 44-52.9
        if (age <= 39) return 42; // Good range: 42-49.9
        if (age <= 49) return 39; // Good range: 39-44.9
        if (age <= 59) return 36; // Good range: 36-42.9
        if (age <= 69) return 36; // Good range: 36-40.9
        return 36;
    } else { // female
        if (age <= 29) return 39; // Good range: 39-48.9
        if (age <= 39) return 37; // Good range: 37-44.9
        if (age <= 49) return 35; // Good range: 35-41.9
        if (age <= 59) return 34; // Good range: 34-39.9
        if (age <= 69) return 33; // Good range: 33-36.9
        return 33;
    }
}

/**
 * Get optimal body fat percentage range based on age and gender
 * @param {number} age - Age in years
 * @param {string} gender - 'male' or 'female'
 * @param {string} fitnessLevel - 'essential', 'athletes', 'fitness', 'average', 'obesity'
 * @returns {Object} Lower and upper bounds for optimal range
 */
function getOptimalBodyFatRange(age, gender, fitnessLevel = 'fitness') {
    if (gender.toLowerCase() === 'male') {
        switch (fitnessLevel) {
            case 'essential':
                return {lower: 2, upper: 5};
            case 'athletes':
                return {lower: 6, upper: 13};
            case 'fitness':
                return {lower: 14, upper: 17};
            case 'average':
                return {lower: 18, upper: 24};
            default:
                return {lower: 14, upper: 17};
        }
    } else {
        switch (fitnessLevel) {
            case 'essential':
                return {lower: 10, upper: 13};
            case 'athletes':
                return {lower: 14, upper: 20};
            case 'fitness':
                return {lower: 21, upper: 24};
            case 'average':
                return {lower: 25, upper: 31};
            default:
                return {lower: 21, upper: 24};
        }
    }
}

/**
 * Calculate Energy Capacity using BMR and dynamic capacity multiplier
 * @param {number} bmr - Basal Metabolic Rate (kcal/day)
 * @param {number} fitnessScore - Fitness score (0-100), can be calculated from VO2 max or body fat
 * @param {number} recoveryScore - Recovery score (0-100) from HRV, sleep quality
 * @param {number} stressIndex - Stress index (0-100) from HRV suppression, cortisol, lactate
 * @param {number} alpha - Coefficient for fitness score (default 2.0)
 * @param {number} beta - Coefficient for recovery score (default 1.5)
 * @param {number} gamma - Coefficient for stress index (default 2.0)
 * @param {Object} vo2Data - Optional VO2 max data for fitness calculation
 * @param {Object} bodyFatData - Optional body fat data for fitness calculation
 * @returns {Object} Energy Capacity with value, components, and calculation details
 */
export function calculateEnergyCapacity(bmr, fitnessScore = null, recoveryScore = 90, stressIndex = 30, vo2Data = null, bodyFatData = null, alpha = 2.0, beta = 1.5, gamma = 2.0) {
    let calculatedFitnessScore = fitnessScore;
    let fitnessCalculationMethod = 'provided';
    let fitnessBreakdown = null;

    // Calculate fitness score if not provided
    if (calculatedFitnessScore === null) {
        if (vo2Data && vo2Data.current && vo2Data.target) {
            // Use VO2 max-based calculation (primary method)
            calculatedFitnessScore = calculateVO2FitnessScore(vo2Data.current, vo2Data.target, vo2Data.sigma);
            fitnessCalculationMethod = 'vo2_max_based';
            fitnessBreakdown = {
                method: 'VO2 Max',
                current: vo2Data.current,
                target: vo2Data.target,
                sigma: vo2Data.sigma || 3.0,
                score: calculatedFitnessScore
            };
        } else if (bodyFatData && bodyFatData.percentage && bodyFatData.lowerBound && bodyFatData.upperBound) {
            // Use body fat percentage-based calculation (fallback)
            calculatedFitnessScore = calculateBodyFatFitnessScore(
                bodyFatData.percentage,
                bodyFatData.lowerBound,
                bodyFatData.upperBound,
                bodyFatData.sigma
            );
            fitnessCalculationMethod = 'body_fat_based';
            fitnessBreakdown = {
                method: 'Body Fat %',
                percentage: bodyFatData.percentage,
                lowerBound: bodyFatData.lowerBound,
                upperBound: bodyFatData.upperBound,
                sigma: bodyFatData.sigma || 2.5,
                score: calculatedFitnessScore
            };
        } else {
            // Default fitness score if no data available
            calculatedFitnessScore = 75;
            fitnessCalculationMethod = 'default';
        }
    }

    // Normalize scores to 0-1 range for calculation
    const fitnessNormalized = calculatedFitnessScore / 100;
    const recoveryNormalized = recoveryScore / 100;
    const stressNormalized = stressIndex / 100;

    // Calculate capacity multiplier
    // CapacityMultiplier = 1.5 + α × FitnessScore + β × RecoveryScore - γ × StressIndex
    let capacityMultiplier = 1.5 + (alpha * fitnessNormalized) + (beta * recoveryNormalized) - (gamma * stressNormalized);

    // Constrain multiplier between 1.0 and 5.0
    capacityMultiplier = Math.min(Math.max(capacityMultiplier, 1.0), 5.0);

    // Calculate final energy capacity
    const energyCapacity = bmr * capacityMultiplier;

    return {
        value: Math.round(energyCapacity * 100) / 100, // Round to 2 decimal places
        bmr,
        capacityMultiplier: Math.round(capacityMultiplier * 1000) / 1000, // Round to 3 decimal places
        components: {
            fitnessScore: calculatedFitnessScore,
            recoveryScore,
            stressIndex,
            fitnessNormalized: Math.round(fitnessNormalized * 1000) / 1000,
            recoveryNormalized: Math.round(recoveryNormalized * 1000) / 1000,
            stressNormalized: Math.round(stressNormalized * 1000) / 1000
        },
        coefficients: {
            alpha,
            beta,
            gamma
        },
        fitnessCalculation: {
            method: fitnessCalculationMethod,
            breakdown: fitnessBreakdown
        },
        inputs: {
            bmr,
            fitnessScore: calculatedFitnessScore,
            recoveryScore,
            stressIndex,
            vo2Data,
            bodyFatData
        },
        trend: null // Not calculated in this implementation
    };
}


export const mockEnergyCapacityTest = async () => {
    await sleep(2000);
    
    // Basic test case: healthy male
    const basalMetabolicRate = calculateBasalMetabolicRate(90, 185, 30, 'male', 75, 50, 12);
    const result1 = calculateEnergyCapacity(basalMetabolicRate.value, 80, 85, 25);
    console.info('Energy Capacity Test 1 (Healthy Male) =', result1);
    
    // Test case 2: Female with VO2 data
    const bmr2 = calculateBasalMetabolicRate(65, 165, 25, 'female', 80, 40, 14);
    const vo2Data = { current: 40, target: getTargetVO2Max(25, 'female'), sigma: 3.0 };
    const result2 = calculateEnergyCapacity(bmr2.value, null, 75, 35, vo2Data);
    console.info('Energy Capacity Test 2 (Female with VO2) =', result2);
    
    // Test case 3: Male with body fat data
    const bmr3 = calculateBasalMetabolicRate(80, 175, 35, 'male', 70, 60, 16);
    const bodyFatData = { percentage: 15, ...getOptimalBodyFatRange(35, 'male', 'fitness') };
    const result3 = calculateEnergyCapacity(bmr3.value, null, 80, 20, null, bodyFatData);
    console.info('Energy Capacity Test 3 (Male with Body Fat) =', result3);
    
    // Test case 4: Edge case - minimum multiplier
    const result4 = calculateEnergyCapacity(1800, 0, 0, 100);
    console.info('Energy Capacity Test 4 (Minimum Multiplier) =', result4);
    
    // Test case 5: Edge case - maximum multiplier
    const result5 = calculateEnergyCapacity(1800, 100, 100, 0);
    console.info('Energy Capacity Test 5 (Maximum Multiplier) =', result5);
    
    // Test case 6: Senior athlete
    const bmr6 = calculateBasalMetabolicRate(70, 170, 60, 'male', 85, 30, 8);
    const vo2Data6 = { current: 38, target: getTargetVO2Max(60, 'male'), sigma: 3.0 };
    const result6 = calculateEnergyCapacity(bmr6.value, null, 90, 15, vo2Data6);
    console.info('Energy Capacity Test 6 (Senior Athlete) =', result6);
    
    return { result1, result2, result3, result4, result5, result6 };
}
mockEnergyCapacityTest();

/**
 * Compare calculated Energy Capacity with API result and provide analysis
 * @param {Object} calculatedEnergyCapacity - Our calculated Energy Capacity
 * @param {Object} apiEnergyCapacity - API's Energy Capacity
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareEnergyCapacity(calculatedEnergyCapacity, apiEnergyCapacity, metrics) {
    if (!apiEnergyCapacity || apiEnergyCapacity.value === null) {
        return {
            available: false,
            message: 'API Energy Capacity not available for comparison'
        };
    }

    const valueDiff = Math.abs(calculatedEnergyCapacity.value - apiEnergyCapacity.value);
    const isWithinRange = valueDiff <= 200; // Allow 200 kcal/day difference

    return {
        available: true,
        valueDiff,
        isWithinRange,
        calculatedEnergyCapacity,
        apiEnergyCapacity,
        metrics: {
            bmr: metrics.bmr,
            fitnessScore: calculatedEnergyCapacity.components.fitnessScore,
            recoveryScore: calculatedEnergyCapacity.components.recoveryScore,
            stressIndex: calculatedEnergyCapacity.components.stressIndex,
            capacityMultiplier: calculatedEnergyCapacity.capacityMultiplier,
            fitnessMethod: calculatedEnergyCapacity.fitnessCalculation.method
        },
        message: isWithinRange ?
            '✅ Energy Capacity calculation matches API within acceptable range' :
            `⚠️ Energy Capacity calculation differs significantly from API (diff: ${valueDiff.toFixed(1)} kcal/day)`
    };
}