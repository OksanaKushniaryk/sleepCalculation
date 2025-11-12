/**
 * Basal Metabolic Rate (BMR) Calculation
 * 
 * BMR accounts for ~60-75% of total energy expenditure. Uses the Mifflin-St Jeor equation
 * with dynamic adjustments based on physiological data (sleep, stress, time of day).
 */

import {sleep} from "../../utils/async-helper.js";

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation with adjustments
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @param {number} age - Age in years
 * @param {string} gender - Gender ('male' or 'female')
 * @param {number} sleepScore - Sleep score from 0 to 100
 * @param {number} stressScore - Stress score from 0 to 100
 * @param {number} timeOfDay - Hour of day (0 to 23)
 * @returns {Object} BMR with value, components, and adjustments
 */
export function calculateBasalMetabolicRate(weight, height, age, gender, sleepScore = 90, stressScore = 50, timeOfDay = 12) {
    // Base BMR calculation using Mifflin-St Jeor equation
    let baseBMR;
    
    if (gender.toLowerCase() === 'male') {
        // For men: BMR = 10 × weight (kg) + 6.25 × height (cm) - 5 × age (years) + 5
        baseBMR = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        // For women: BMR = 10 × weight (kg) + 6.25 × height (cm) - 5 × age (years) - 161
        baseBMR = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    // Calculate adjustment factors
    
    // Sleep Adjustment Factor: F_sleep = 0.90 + 0.10 × (S / 100)
    const sleepAdjustmentFactor = 0.90 + 0.10 * (sleepScore / 100);
    
    // Stress Adjustment Factor: F_stress = 1.00 + 0.15 × (T / 100)
    const stressAdjustmentFactor = 1.00 + 0.15 * (stressScore / 100);
    
    // Time-of-Day Adjustment Factor: F_time(h) = 1.00 + 0.10 × sin((2 × π / 24) × (h - 16))
    const timeAdjustmentFactor = 1.00 + 0.10 * Math.sin((2 * Math.PI / 24) * (timeOfDay - 16));
    
    // Total Adjusted BMR: AdjustedBMR = BMR × F_sleep × F_stress × F_time
    const adjustedBMR = baseBMR * sleepAdjustmentFactor * stressAdjustmentFactor * timeAdjustmentFactor;
    
    return {
        value: Math.round(adjustedBMR * 100) / 100, // Round to 2 decimal places
        baseBMR: Math.round(baseBMR * 100) / 100,
        adjustmentFactors: {
            sleep: Math.round(sleepAdjustmentFactor * 1000) / 1000, // Round to 3 decimal places
            stress: Math.round(stressAdjustmentFactor * 1000) / 1000,
            timeOfDay: Math.round(timeAdjustmentFactor * 1000) / 1000
        },
        inputs: {
            weight,
            height,
            age,
            gender,
            sleepScore,
            stressScore,
            timeOfDay
        },
        trend: null // Not calculated in this implementation
    };
}

export const mockBasalMetabolicRateTest = async () => {
    await sleep(2000);
    /// real test
    const result = calculateBasalMetabolicRate(90, 185, 30, 'male', 75, 50, 12);

    console.info('calculate Basal Metabolic Rate =', result);

    return result;
}
mockBasalMetabolicRateTest();

/**
 * Compare calculated BMR with API result and provide analysis
 * @param {Object} calculatedBMR - Our calculated BMR
 * @param {Object} apiBMR - API's BMR
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareBasalMetabolicRates(calculatedBMR, apiBMR, metrics) {
    if (!apiBMR || apiBMR.value === null) {
        return {
            available: false,
            message: 'API Basal Metabolic Rate not available for comparison'
        };
    }

    const valueDiff = Math.abs(calculatedBMR.value - apiBMR.value);
    const isWithinRange = valueDiff <= 50; // Allow 50 kcal/day difference

    return {
        available: true,
        valueDiff,
        isWithinRange,
        calculatedBMR,
        apiBMR,
        metrics: {
            weight: metrics.weight,
            height: metrics.height,
            age: metrics.age,
            gender: metrics.gender,
            sleepScore: metrics.sleepScore,
            stressScore: metrics.stressScore,
            timeOfDay: metrics.timeOfDay
        },
        message: isWithinRange ? 
            '✅ Basal Metabolic Rate calculation matches API within acceptable range' :
            `⚠️ Basal Metabolic Rate calculation differs significantly from API (diff: ${valueDiff.toFixed(1)} kcal/day)`
    };
}