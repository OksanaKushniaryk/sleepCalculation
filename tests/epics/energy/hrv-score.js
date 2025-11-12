/**
 * HRV Score Calculation
 * 
 * HRV Score uses a Gaussian distribution to evaluate Heart Rate Variability relative to personal baseline.
 * 
 * Formula:
 * If x ≥ μ: HRV_score = 100
 * If x < μ: HRV_score = 100 × e^(-(μ - x)^2 / (2 × σ^2))
 * 
 * Where:
 * - x = today's (or smoothed) Heart Rate Variability (HRV, ms)
 * - μ = personal baseline HRV (e.g., 14-day weighted average or age-based reference)
 * - σ = acceptable deviation (e.g., 10 ms for trained athletes, 20 ms for general population)
 */

import {sleep} from "../../utils/async-helper.js";

/**
 * Calculate HRV Score using Gaussian distribution relative to personal baseline
 * @param {number} currentHRV - Today's (or smoothed) HRV value in ms
 * @param {number} baselineHRV - Personal baseline HRV (μ) in ms
 * @param {number} acceptableDeviation - Acceptable deviation (σ) in ms (default 20 for general population)
 * @param {string} populationType - 'athlete' or 'general' to set default sigma values
 * @returns {Object} HRV Score with value, components, and calculation details
 */
export function calculateHRVScore(currentHRV, baselineHRV, acceptableDeviation = null, populationType = 'general') {
    // Set default acceptable deviation based on population type if not provided
    let sigma = acceptableDeviation;
    if (sigma === null) {
        sigma = populationType === 'athlete' ? 10 : 20; // 10 ms for athletes, 20 ms for general population
    }
    
    // Validate inputs
    if (currentHRV === null || currentHRV === undefined || baselineHRV === null || baselineHRV === undefined) {
        throw new Error('Both current HRV and baseline HRV are required for HRV Score calculation');
    }
    
    if (currentHRV < 0 || baselineHRV < 0 || sigma <= 0) {
        throw new Error('HRV values and sigma must be positive numbers');
    }
    
    let hrvScore;
    let calculationMethod;
    
    if (currentHRV >= baselineHRV) {
        // If current HRV is at or above baseline, perfect score
        hrvScore = 100;
        calculationMethod = 'optimal_or_above_baseline';
    } else {
        // If current HRV is below baseline, use Gaussian distribution
        // HRV_score = 100 × e^(-(μ - x)^2 / (2 × σ^2))
        const deviation = baselineHRV - currentHRV;
        const exponent = -(Math.pow(deviation, 2)) / (2 * Math.pow(sigma, 2));
        hrvScore = 100 * Math.exp(exponent);
        calculationMethod = 'gaussian_below_baseline';
    }
    
    return {
        value: Math.round(hrvScore * 100) / 100, // Round to 2 decimal places
        currentHRV,
        baselineHRV,
        acceptableDeviation: sigma,
        populationType,
        calculationMethod,
        components: {
            deviation: Math.abs(currentHRV - baselineHRV),
            deviationDirection: currentHRV >= baselineHRV ? 'above_baseline' : 'below_baseline',
            normalizedDeviation: Math.abs(currentHRV - baselineHRV) / sigma,
            gaussianExponent: calculationMethod === 'gaussian_below_baseline' ? 
                -(Math.pow(baselineHRV - currentHRV, 2)) / (2 * Math.pow(sigma, 2)) : null
        },
        inputs: {
            currentHRV,
            baselineHRV,
            acceptableDeviation: sigma,
            populationType
        },
        trend: null // Not calculated in this implementation
    };
}

/**
 * Compare calculated HRV Score with API result and provide analysis
 * @param {Object} calculatedHRVScore - Our calculated HRV Score
 * @param {Object} apiHRVScore - API's HRV Score
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareHRVScore(calculatedHRVScore, apiHRVScore, metrics) {
    if (!apiHRVScore || apiHRVScore.value === null) {
        return {
            available: false,
            message: 'API HRV Score not available for comparison'
        };
    }

    const valueDiff = Math.abs(calculatedHRVScore.value - apiHRVScore.value);
    const isWithinRange = valueDiff <= 5; // Allow 5 points difference

    return {
        available: true,
        valueDiff,
        isWithinRange,
        calculatedHRVScore,
        apiHRVScore,
        metrics: {
            currentHRV: calculatedHRVScore.currentHRV,
            baselineHRV: calculatedHRVScore.baselineHRV,
            acceptableDeviation: calculatedHRVScore.acceptableDeviation,
            populationType: calculatedHRVScore.populationType,
            calculationMethod: calculatedHRVScore.calculationMethod,
            deviation: calculatedHRVScore.components.deviation,
            deviationDirection: calculatedHRVScore.components.deviationDirection
        },
        message: isWithinRange ? 
            '✅ HRV Score calculation matches API within acceptable range' :
            `⚠️ HRV Score calculation differs significantly from API (diff: ${valueDiff.toFixed(1)} points)`
    };
}

export const mockHRVScoreTest = async () => {
    await sleep(2000);
    
    console.info('\n=== HRV Score Calculation Tests ===\n');
    
    // Test 1: Perfect HRV (current = baseline)
    console.info('1. Perfect HRV Score (current = baseline):');
    const perfectHRV = calculateHRVScore(30, 30, 15, 'general');
    console.info('calculateHRVScore(30, 30, 15, "general") =', perfectHRV);
    console.info(`Expected: 100, Got: ${perfectHRV.value}, Method: ${perfectHRV.calculationMethod}\n`);
    
    // Test 2: HRV above baseline
    console.info('2. HRV Above Baseline:');
    const aboveBaselineHRV = calculateHRVScore(35, 30, 15, 'general');
    console.info('calculateHRVScore(35, 30, 15, "general") =', aboveBaselineHRV);
    console.info(`Expected: 100, Got: ${aboveBaselineHRV.value}, Method: ${aboveBaselineHRV.calculationMethod}\n`);
    
    // Test 3: HRV slightly below baseline (general population)
    console.info('3. HRV Slightly Below Baseline (General):');
    const slightlyBelowGeneral = calculateHRVScore(25, 30, 15, 'general');
    console.info('calculateHRVScore(25, 30, 15, "general") =', slightlyBelowGeneral);
    console.info(`HRV below baseline by ${slightlyBelowGeneral.components.deviation}ms, Score: ${slightlyBelowGeneral.value}\n`);
    
    // Test 4: HRV moderately below baseline (general population)
    console.info('4. HRV Moderately Below Baseline (General):');
    const moderatelyBelowGeneral = calculateHRVScore(15, 30, 15, 'general');
    console.info('calculateHRVScore(15, 30, 15, "general") =', moderatelyBelowGeneral);
    console.info(`HRV below baseline by ${moderatelyBelowGeneral.components.deviation}ms, Score: ${moderatelyBelowGeneral.value}\n`);
    
    // Test 5: HRV significantly below baseline (general population)
    console.info('5. HRV Significantly Below Baseline (General):');
    const significantlyBelowGeneral = calculateHRVScore(5, 30, 15, 'general');
    console.info('calculateHRVScore(5, 30, 15, "general") =', significantlyBelowGeneral);
    console.info(`HRV below baseline by ${significantlyBelowGeneral.components.deviation}ms, Score: ${significantlyBelowGeneral.value}\n`);
    
    // Test 6: Athlete population - perfect HRV
    console.info('6. Athlete Perfect HRV:');
    const athletePerfect = calculateHRVScore(50, 50, null, 'athlete');
    console.info('calculateHRVScore(50, 50, null, "athlete") =', athletePerfect);
    console.info(`Expected: 100, Got: ${athletePerfect.value}, Sigma: ${athletePerfect.acceptableDeviation}\n`);
    
    // Test 7: Athlete HRV below baseline (stricter sigma)
    console.info('7. Athlete HRV Below Baseline:');
    const athleteBelow = calculateHRVScore(45, 50, null, 'athlete');
    console.info('calculateHRVScore(45, 50, null, "athlete") =', athleteBelow);
    console.info(`Athlete HRV below baseline by ${athleteBelow.components.deviation}ms, Score: ${athleteBelow.value}, Sigma: ${athleteBelow.acceptableDeviation}\n`);
    
    // Test 8: Custom sigma value
    console.info('8. Custom Sigma Value:');
    const customSigma = calculateHRVScore(20, 30, 5, 'general');
    console.info('calculateHRVScore(20, 30, 5, "general") =', customSigma);
    console.info(`Custom sigma=5, HRV below baseline by ${customSigma.components.deviation}ms, Score: ${customSigma.value}\n`);
    
    // Test 9: Low baseline HRV
    console.info('9. Low Baseline HRV:');
    const lowBaseline = calculateHRVScore(8, 10, 5, 'general');
    console.info('calculateHRVScore(8, 10, 5, "general") =', lowBaseline);
    console.info(`Low baseline scenario, Score: ${lowBaseline.value}\n`);
    
    // Test 10: High baseline HRV
    console.info('10. High Baseline HRV:');
    const highBaseline = calculateHRVScore(45, 50, 10, 'athlete');
    console.info('calculateHRVScore(45, 50, 10, "athlete") =', highBaseline);
    console.info(`High baseline scenario, Score: ${highBaseline.value}\n`);
    
    // Test 11: Edge case - minimal current HRV
    console.info('11. Edge Case - Minimal Current HRV:');
    const minimalHRV = calculateHRVScore(1, 30, 20, 'general');
    console.info('calculateHRVScore(1, 30, 20, "general") =', minimalHRV);
    console.info(`Minimal HRV (1ms), Score: ${minimalHRV.value}\n`);
    
    // Test 12: Edge case - very high current HRV
    console.info('12. Edge Case - Very High Current HRV:');
    const veryHighHRV = calculateHRVScore(100, 30, 20, 'general');
    console.info('calculateHRVScore(100, 30, 20, "general") =', veryHighHRV);
    console.info(`Very high HRV (100ms), Score: ${veryHighHRV.value}\n`);
    
    // Test 13: Default parameters test
    console.info('13. Default Parameters Test (General Population):');
    const defaultGeneral = calculateHRVScore(25, 30);
    console.info('calculateHRVScore(25, 30) =', defaultGeneral);
    console.info(`Default sigma for general: ${defaultGeneral.acceptableDeviation}, Score: ${defaultGeneral.value}\n`);
    
    // Test 14: Error handling - null values
    console.info('14. Error Handling - Null Values:');
    try {
        const nullTest = calculateHRVScore(null, 30, 20, 'general');
        console.info('Should not reach here - null test failed');
    } catch (error) {
        console.info('Expected error for null currentHRV:', error.message);
    }
    
    try {
        const nullBaseline = calculateHRVScore(30, null, 20, 'general');
        console.info('Should not reach here - null baseline test failed');
    } catch (error) {
        console.info('Expected error for null baselineHRV:', error.message);
    }
    
    // Test 15: Error handling - negative values
    console.info('\n15. Error Handling - Negative Values:');
    try {
        const negativeTest = calculateHRVScore(-5, 30, 20, 'general');
        console.info('Should not reach here - negative test failed');
    } catch (error) {
        console.info('Expected error for negative currentHRV:', error.message);
    }
    
    try {
        const negativeSigma = calculateHRVScore(30, 30, -10, 'general');
        console.info('Should not reach here - negative sigma test failed');
    } catch (error) {
        console.info('Expected error for negative sigma:', error.message);
    }
    
    console.info('\n=== HRV Score Tests Completed ===\n');
    
    return perfectHRV;
}

mockHRVScoreTest();