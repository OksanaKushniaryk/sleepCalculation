/**
 * Total Energy Credit Score Calculation
 *
 * Uses a sigmoid function to combine current energy credit score with
 * rolling average for a smoothed total energy credit assessment.
 */

/**
 * Calculate Total Energy Credit Score based on OneVital formula
 * @param {number} energyCreditCurrentScore - Today's adjusted Energy Credit Score
 * @param {number} energyCreditRollingAvg - 7-day weighted average of past scores
 * @returns {Object} Total energy credit score with value, normDeviation, and trend
 */
export function calculateTotalEnergyCreditScore(energyCreditCurrentScore, energyCreditRollingAvg) {
    // Default values if not provided
    const currentScore = energyCreditCurrentScore || 0;
    const rollingAvg = energyCreditRollingAvg || 0;

    // Calculate sum for sigmoid input
    const sum = currentScore + rollingAvg;

    // Apply sigmoid function: TotalEnergyCreditScore = 1 / (1 + exp(-(CurrentScore + RollingAVG)))
    const sigmoidOutput = 1 / (1 + Math.exp(-sum));

    // Convert to 0-100 scale
    const totalEnergyCreditScore = sigmoidOutput * 100;

    // Calculate normalization deviation (using the sum as the deviation metric)
    const normDeviation = sum;

    return {
        value: Math.round(totalEnergyCreditScore * 100) / 100, // Round to 2 decimal places
        normDeviation: Math.round(normDeviation * 100) / 100, // Round to 2 decimal places
        trend: null // Not calculated in this implementation
    };
}

/**
 * Calculate 7-day weighted average using OneVital weights
 * @param {Array} pastScores - Array of past 7 energy credit scores (most recent first)
 * @returns {number} Weighted average
 */
export function calculateWeightedRollingAverage(pastScores) {
    if (!pastScores || !Array.isArray(pastScores) || pastScores.length === 0) {
        return 0;
    }

    // OneVital weights: w = [1, 1, 1, 1, 2, 2, 3]/11 (most recent gets highest weight)
    // Weights should be applied to [day-6, day-5, day-4, day-3, day-2, day-1, today]
    const weights = [1, 1, 1, 1, 2, 2, 3];
    const totalWeight = weights.reduce((sum, w) => sum + w, 0); // 11

    // Pad the array if we have fewer than 7 scores
    const paddedScores = [...pastScores];
    while (paddedScores.length < 7) {
        paddedScores.unshift(0); // Pad with zeros for missing historical data
    }

    // Take only the last 7 scores if we have more
    const last7Scores = paddedScores.slice(-7);

    // Calculate weighted sum
    let weightedSum = 0;
    for (let i = 0; i < last7Scores.length; i++) {
        weightedSum += last7Scores[i] * weights[i];
    }

    return weightedSum / totalWeight;
}

/**
 * Compare calculated total energy credit score with API result and provide analysis
 * @param {Object} calculatedScore - Our calculated total energy credit score
 * @param {Object} apiScore - API's total energy credit score
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareTotalEnergyCreditScores(calculatedScore, apiScore, metrics) {
    if (!apiScore || apiScore.value === null) {
        return {
            available: false,
            message: 'API Total Energy Credit Score not available for comparison'
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
            energyCreditCurrentScore: metrics.energyCreditCurrentScore,
            energyCreditRollingAvg: metrics.energyCreditRollingAvg,
            calculatedSum: (metrics.energyCreditCurrentScore || 0) + (metrics.energyCreditRollingAvg || 0)
        },
        message: isWithinRange ?
            '✅ Total Energy Credit score calculation matches API within acceptable range' :
            `⚠️ Total Energy Credit score calculation differs significantly from API (diff: ${valueDiff})`
    };
}