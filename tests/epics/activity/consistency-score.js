/**
 * Consistency Score Calculation
 *
 * Measures how consistent your step count is across the past 7 days.
 * Less deviation = better health patterns.
 */

/**
 * Calculate Consistency Score based on OneVital formula
 * @param {Array} steps7dArray - Array of daily step counts for the past 7 days
 * @param {number} steps7dMean - 7-day mean step count
 * @param {number} steps7dStdDev - 7-day standard deviation
 * @returns {Object} Consistency score with value, normDeviation, and trend
 */
export function calculateConsistencyScore(steps7dArray, steps7dMean, steps7dStdDev) {
    // Use provided standard deviation or calculate from array
    let sigmaW = steps7dStdDev;

    if (!sigmaW && steps7dArray && steps7dArray.length === 7) {
        // Calculate 7-day mean if not provided
        const mean = steps7dMean || steps7dArray.reduce((sum, steps) => sum + steps, 0) / 7;

        // Calculate standard deviation: σ_w = sqrt((Σ(x_i - x̄)^2) / 7)
        const squaredDifferences = steps7dArray.map(steps => Math.pow(steps - mean, 2));
        const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / 7;
        sigmaW = Math.sqrt(variance);
    }

    // Default to provided standard deviation or use a reasonable default
    if (!sigmaW) {
        sigmaW = steps7dStdDev || 0;
    }

    // Reference tolerance (from formula)
    const sigmaRef = 1500; // tolerance

    // Calculate score: S_Consistency = 100 × max(0, 1 - (σ_w / σ_ref))
    const ratio = sigmaW / sigmaRef;
    const consistencyScore = 100 * Math.max(0, 1 - ratio);

    // Calculate normalization deviation (relative to reference)
    const normDeviation = sigmaW / sigmaRef;

    return {
        value: Math.round(consistencyScore),
        normDeviation: Math.round(normDeviation * 100) / 100, // Round to 2 decimal places
        trend: null // Not calculated in this implementation
    };
}

/**
 * Compare calculated consistency score with API result and provide analysis
 * @param {Object} calculatedScore - Our calculated consistency score
 * @param {Object} apiScore - API's consistency score
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareConsistencyScores(calculatedScore, apiScore, metrics) {
    if (!apiScore || apiScore.value === null) {
        return {
            available: false,
            message: 'API Consistency Score not available for comparison'
        };
    }

    const valueDiff = Math.abs(calculatedScore.value - apiScore.value);
    const normDevDiff = apiScore.normDeviation !== undefined ?
        Math.abs(calculatedScore.normDeviation - apiScore.normDeviation) : null;

    const isWithinRange = valueDiff <= 5; // Allow 5 point difference

    return {
        available: true,
        valueDiff,
        normDevDiff,
        isWithinRange,
        calculatedScore,
        apiScore,
        metrics: {
            steps7dMean: metrics.steps7dMean,
            steps7dStdDev: metrics.steps7dStdDev,
            steps7dArray: metrics.steps7dArray || 'N/A'
        },
        message: isWithinRange ?
            '✅ Consistency score calculation matches API within acceptable range' :
            `⚠️ Consistency score calculation differs significantly from API (diff: ${valueDiff})`
    };
}