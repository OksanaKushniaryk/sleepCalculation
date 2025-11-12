/**
 * Recovery Score Calculation
 * 
 * The Recovery Score quantifies how well the body is prepared for stress and activity.
 * It is derived from two components: HRV Score and Sleep Score.
 * 
 * Formula: RecoveryScore = (w1 × HRV_score + w2 × SleepScore) / (w1 + w2)
 * Where: w1, w2 = weights for HRV and Sleep (e.g., w1 = 0.6, w2 = 0.4)
 */

import {sleep} from "../../utils/async-helper.js";
import {calculateHRVScore} from "./hrv-score.js";

/**
 * Calculate Recovery Score using weighted average of HRV and Sleep scores
 * @param {number} hrvScore - HRV score from HRV formula
 * @param {number} sleepScore - Existing sleep score
 * @param {number} w1 - Weight for HRV score (default 0.6)
 * @param {number} w2 - Weight for Sleep score (default 0.4)
 * @returns {Object} Recovery Score with value, components, and calculation details
 */
export function calculateRecoveryScore(hrvScore, sleepScore, w1 = 0.6, w2 = 0.4) {
    // Validate inputs
    if (hrvScore === null || hrvScore === undefined || sleepScore === null || sleepScore === undefined) {
        throw new Error('Both HRV score and Sleep score are required for Recovery Score calculation');
    }
    
    // Ensure scores are within valid range (0-100)
    const normalizedHrvScore = Math.max(0, Math.min(100, hrvScore));
    const normalizedSleepScore = Math.max(0, Math.min(100, sleepScore));
    
    // Calculate weighted average
    // RecoveryScore = (w1 × HRV_score + w2 × SleepScore) / (w1 + w2)
    const weightedHrvContribution = w1 * normalizedHrvScore;
    const weightedSleepContribution = w2 * normalizedSleepScore;
    const totalWeight = w1 + w2;
    
    const recoveryScore = (weightedHrvContribution + weightedSleepContribution) / totalWeight;
    
    return {
        value: Math.round(recoveryScore * 100) / 100, // Round to 2 decimal places
        components: {
            hrvScore: normalizedHrvScore,
            sleepScore: normalizedSleepScore,
            hrvContribution: Math.round(weightedHrvContribution * 100) / 100,
            sleepContribution: Math.round(weightedSleepContribution * 100) / 100,
            hrvWeight: w1,
            sleepWeight: w2,
            totalWeight
        },
        weights: {
            hrv: w1,
            sleep: w2,
            hrvPercentage: Math.round((w1 / totalWeight) * 100),
            sleepPercentage: Math.round((w2 / totalWeight) * 100)
        },
        inputs: {
            hrvScore: normalizedHrvScore,
            sleepScore: normalizedSleepScore,
            w1,
            w2
        },
        trend: null // Not calculated in this implementation
    };
}

/**
 * Compare calculated Recovery Score with API result and provide analysis
 * @param {Object} calculatedRecoveryScore - Our calculated Recovery Score
 * @param {Object} apiRecoveryScore - API's Recovery Score
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareRecoveryScore(calculatedRecoveryScore, apiRecoveryScore, metrics) {
    if (!apiRecoveryScore || apiRecoveryScore.value === null) {
        return {
            available: false,
            message: 'API Recovery Score not available for comparison'
        };
    }

    const valueDiff = Math.abs(calculatedRecoveryScore.value - apiRecoveryScore.value);
    const isWithinRange = valueDiff <= 5; // Allow 5 points difference

    return {
        available: true,
        valueDiff,
        isWithinRange,
        calculatedRecoveryScore,
        apiRecoveryScore,
        metrics: {
            hrvScore: calculatedRecoveryScore.components.hrvScore,
            sleepScore: calculatedRecoveryScore.components.sleepScore,
            hrvWeight: calculatedRecoveryScore.weights.hrv,
            sleepWeight: calculatedRecoveryScore.weights.sleep,
            hrvContribution: calculatedRecoveryScore.components.hrvContribution,
            sleepContribution: calculatedRecoveryScore.components.sleepContribution
        },
        message: isWithinRange ? 
            '✅ Recovery Score calculation matches API within acceptable range' :
            `⚠️ Recovery Score calculation differs significantly from API (diff: ${valueDiff.toFixed(1)} points)`
    };
}

export const mockRecoveryScoreTest = async () => {
    await sleep(2000);
    
    console.info('\n=== Recovery Score Calculation Tests ===\n');
    
    // Test 1: Perfect scores with default weights
    console.info('1. Perfect Scores (Default Weights):');
    const perfectScores = calculateRecoveryScore(100, 100);
    console.info('calculateRecoveryScore(100, 100) =', perfectScores);
    console.info(`Expected: 100, Got: ${perfectScores.value}, HRV Weight: ${perfectScores.weights.hrv}, Sleep Weight: ${perfectScores.weights.sleep}\n`);
    
    // Test 2: Mixed scores with default weights (60% HRV, 40% Sleep)
    console.info('2. Mixed Scores (Default Weights 0.6/0.4):');
    const mixedDefault = calculateRecoveryScore(80, 90);
    console.info('calculateRecoveryScore(80, 90) =', mixedDefault);
    console.info(`HRV: 80, Sleep: 90, Recovery Score: ${mixedDefault.value}\n`);
    
    // Test 3: Equal weights (50/50)
    console.info('3. Equal Weights (0.5/0.5):');
    const equalWeights = calculateRecoveryScore(80, 90, 0.5, 0.5);
    console.info('calculateRecoveryScore(80, 90, 0.5, 0.5) =', equalWeights);
    console.info(`Equal weights - Recovery Score: ${equalWeights.value}\n`);
    
    // Test 4: HRV-heavy weighting (80% HRV, 20% Sleep)
    console.info('4. HRV-Heavy Weighting (0.8/0.2):');
    const hrvHeavy = calculateRecoveryScore(70, 90, 0.8, 0.2);
    console.info('calculateRecoveryScore(70, 90, 0.8, 0.2) =', hrvHeavy);
    console.info(`HRV-heavy weights - Recovery Score: ${hrvHeavy.value}\n`);
    
    // Test 5: Sleep-heavy weighting (20% HRV, 80% Sleep)
    console.info('5. Sleep-Heavy Weighting (0.2/0.8):');
    const sleepHeavy = calculateRecoveryScore(70, 90, 0.2, 0.8);
    console.info('calculateRecoveryScore(70, 90, 0.2, 0.8) =', sleepHeavy);
    console.info(`Sleep-heavy weights - Recovery Score: ${sleepHeavy.value}\n`);
    
    // Test 6: Low HRV, high Sleep
    console.info('6. Low HRV, High Sleep:');
    const lowHrvHighSleep = calculateRecoveryScore(30, 95);
    console.info('calculateRecoveryScore(30, 95) =', lowHrvHighSleep);
    console.info(`Low HRV impact - Recovery Score: ${lowHrvHighSleep.value}\n`);
    
    // Test 7: High HRV, low Sleep
    console.info('7. High HRV, Low Sleep:');
    const highHrvLowSleep = calculateRecoveryScore(95, 30);
    console.info('calculateRecoveryScore(95, 30) =', highHrvLowSleep);
    console.info(`Low Sleep impact - Recovery Score: ${highHrvLowSleep.value}\n`);
    
    // Test 8: Both scores very low
    console.info('8. Both Scores Very Low:');
    const bothLow = calculateRecoveryScore(20, 25);
    console.info('calculateRecoveryScore(20, 25) =', bothLow);
    console.info(`Poor recovery state - Recovery Score: ${bothLow.value}\n`);
    
    // Test 9: Edge case - zero scores
    console.info('9. Edge Case - Zero Scores:');
    const zeroScores = calculateRecoveryScore(0, 0);
    console.info('calculateRecoveryScore(0, 0) =', zeroScores);
    console.info(`Minimum possible - Recovery Score: ${zeroScores.value}\n`);
    
    // Test 10: Edge case - scores above 100 (should be normalized)
    console.info('10. Edge Case - Scores Above 100 (Normalized):');
    const aboveHundred = calculateRecoveryScore(120, 110);
    console.info('calculateRecoveryScore(120, 110) =', aboveHundred);
    console.info(`Over 100 normalized - HRV: ${aboveHundred.components.hrvScore}, Sleep: ${aboveHundred.components.sleepScore}, Recovery: ${aboveHundred.value}\n`);
    
    // Test 11: Edge case - negative scores (should be normalized)
    console.info('11. Edge Case - Negative Scores (Normalized):');
    const negativeScores = calculateRecoveryScore(-10, -5);
    console.info('calculateRecoveryScore(-10, -5) =', negativeScores);
    console.info(`Negative normalized - HRV: ${negativeScores.components.hrvScore}, Sleep: ${negativeScores.components.sleepScore}, Recovery: ${negativeScores.value}\n`);
    
    // Test 12: Custom weights that don't sum to 1
    console.info('12. Custom Weights (3/7):');
    const customWeights = calculateRecoveryScore(60, 80, 3, 7);
    console.info('calculateRecoveryScore(60, 80, 3, 7) =', customWeights);
    console.info(`Custom weights (3/7) - Recovery Score: ${customWeights.value}, Total Weight: ${customWeights.components.totalWeight}\n`);
    
    // Test 13: Realistic scenario - good recovery
    console.info('13. Realistic Scenario - Good Recovery:');
    const goodRecovery = calculateRecoveryScore(85, 88);
    console.info('calculateRecoveryScore(85, 88) =', goodRecovery);
    console.info(`Good recovery state - Recovery Score: ${goodRecovery.value}\n`);
    
    // Test 14: Realistic scenario - poor recovery
    console.info('14. Realistic Scenario - Poor Recovery:');
    const poorRecovery = calculateRecoveryScore(45, 55);
    console.info('calculateRecoveryScore(45, 55) =', poorRecovery);
    console.info(`Poor recovery state - Recovery Score: ${poorRecovery.value}\n`);
    
    // Test 15: Integration with HRV calculation
    console.info('15. Integration Test with HRV Calculation:');
    const hrvResult = calculateHRVScore(25, 30, 15, 'general'); // Slightly below baseline
    const sleepScore = 85;
    const integrated = calculateRecoveryScore(hrvResult.value, sleepScore);
    console.info(`HRV calculation result: ${hrvResult.value}, Sleep: ${sleepScore}`);
    console.info('Recovery Score =', integrated);
    console.info(`Integrated calculation - Recovery Score: ${integrated.value}\n`);
    
    // Test 16: Error handling - null HRV score
    console.info('16. Error Handling - Null HRV Score:');
    try {
        const nullHrv = calculateRecoveryScore(null, 80);
        console.info('Should not reach here - null HRV test failed');
    } catch (error) {
        console.info('Expected error for null HRV score:', error.message);
    }
    
    // Test 17: Error handling - null Sleep score
    console.info('\n17. Error Handling - Null Sleep Score:');
    try {
        const nullSleep = calculateRecoveryScore(80, null);
        console.info('Should not reach here - null Sleep test failed');
    } catch (error) {
        console.info('Expected error for null Sleep score:', error.message);
    }
    
    // Test 18: Error handling - undefined values
    console.info('\n18. Error Handling - Undefined Values:');
    try {
        const undefinedTest = calculateRecoveryScore(undefined, 80);
        console.info('Should not reach here - undefined test failed');
    } catch (error) {
        console.info('Expected error for undefined HRV score:', error.message);
    }
    
    console.info('\n=== Recovery Score Tests Completed ===\n');
    
    return perfectScores;
}

mockRecoveryScoreTest();