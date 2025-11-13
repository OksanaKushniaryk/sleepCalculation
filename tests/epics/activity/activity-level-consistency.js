/**
 * Activity Level Consistency Calculation
 *
 * Measures how steps are distributed throughout the day using Gini coefficient.
 * Low Gini = evenly spread steps = good
 * High Gini = clumped activity = not good
 */

/**
 * Calculate Activity Level Consistency Score based on OneVital formula
 * @param {Array} stepsBins - Array of step counts across different time bins
 * @param {number} giniMeanStepsPerBin - Pre-calculated Gini coefficient (if available)
 * @returns {Object} Activity level consistency score with value, normDeviation, and trend
 */
export function calculateActivityLevelConsistencyScore(stepsBins, giniMeanStepsPerBin, steps7dStdDev) {
    // Use provided Gini coefficient or calculate from bins
    let giniCoefficient = 0;

    if (Array.isArray(stepsBins) && stepsBins?.length) {
        giniCoefficient = calculateGiniCoefficient(stepsBins);
    }

    // Handle edge cases
    const mean = giniMeanStepsPerBin || stepsBins ? stepsBins.reduce((sum, steps) => sum + steps, 0) / stepsBins.length : 0;
    const stdDev = stepsBins ? calculateStandardDeviation(stepsBins, mean) : 0;

    let consistencyScore;

    // Edge case 1: All zeros → should return 0
    if (mean < 1e-8) {
        consistencyScore = 0;
    }
    // Edge case 2: All values identical → should return 100
    else if (stdDev < 1e-8) {
        consistencyScore = 100;
    }
    // Normal case: Consistency_score = 100 × (1 - G)
    else {
        consistencyScore = 100 * (1 - giniCoefficient);
    }

    // Ensure score is within bounds
    consistencyScore = Math.max(0, Math.min(100, consistencyScore));

    // Calculate normalization deviation (Gini coefficient itself)
    const normDeviation = giniCoefficient;

    return {
        value: Math.round(consistencyScore),
        normDeviation: Math.round(normDeviation * 1000) / 1000, // Round to 3 decimal places
        trend: null // Not calculated in this implementation
    };
}

/**
 * Calculate Gini coefficient from steps bins
 * @param {Array} stepsBins - Array of step counts across time bins
 * @returns {number} Gini coefficient (0 = perfect equality, 1 = perfect inequality)
 */
function calculateGiniCoefficient(stepsBins) {
    if (!stepsBins || stepsBins.length === 0) {
        return 0;
    }

    const N = stepsBins.length;

    // Step 1: Sort the array
    const x_sorted = [...stepsBins].sort((a, b) => a - b);

    // Step 2: Calculate cumulative sum
    const cumx = [];
    let sum = 0;
    for (let i = 0; i < x_sorted.length; i++) {
        sum += x_sorted[i];
        cumx.push(sum);
    }

    // Step 3: Calculate Gini coefficient
    // G = (N + 1 - 2 * Σ(cumx) / Σ(x)) / N
    const totalSum = cumx[cumx.length - 1]; // Last element is the total sum
    const sumOfCumx = cumx.reduce((acc, val) => acc + val, 0);

    if (totalSum === 0) {
        return 0; // All zeros case
    }

    const G = (N + 1 - 2 * sumOfCumx / totalSum) / N;

    return Math.max(0, Math.min(1, G)); // Ensure G is between 0 and 1
}

/**
 * Calculate standard deviation of an array
 * @param {Array} values - Array of numeric values
 * @param {number} mean - Pre-calculated mean (optional)
 * @returns {number} Standard deviation
 */
function calculateStandardDeviation(values, mean) {
    if (!values || values.length === 0) {
        return 0;
    }

    const avg = mean !== undefined ? mean : values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - avg, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;

    return Math.sqrt(variance);
}

/**
 * Compare calculated activity level consistency score with API result and provide analysis
 * @param {Object} calculatedScore - Our calculated activity level consistency score
 * @param {Object} apiScore - API's activity level consistency score
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareActivityLevelConsistencyScores(calculatedScore, apiScore, metrics) {
    if (!apiScore || apiScore.value === null) {
        return {
            available: false,
            message: 'API Activity Level Consistency Score not available for comparison'
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
            giniMeanStepsPerBin: metrics.giniMeanStepsPerBin,
            stepsBins: metrics.stepsBins ? `${metrics.stepsBins.length} bins` : 'N/A',
            calculationMethod: metrics.giniMeanStepsPerBin !== undefined ? 'from_gini_metric' : 'from_bins_array'
        },
        message: isWithinRange ?
            '✅ Activity Level Consistency score calculation matches API within acceptable range' :
            `⚠️ Activity Level Consistency score calculation differs significantly from API (diff: ${valueDiff})`
    };
}