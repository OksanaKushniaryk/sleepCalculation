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