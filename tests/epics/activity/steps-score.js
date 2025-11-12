/**
 * Steps Score Calculation
 *
 * Implements the OneVital Steps Score formula that quantifies how close
 * the user is to their daily step goal or baseline.
 */

/**
 * Calculate Steps Score based on OneVital formula
 * @param {number} stepsTodayX - Steps taken today
 * @param {number} baselineStepsMu - Personal baseline steps (mean)
 * @param {number} sigmaInput - default 2000
 * @param {number} steps7dTotalArray - 7-day value of steps
 * @returns {Object} Steps score with value, normDeviation, and trend
 */
export function calculateStepsScore(stepsTodayX, baselineStepsMu, sigmaInput, steps7dTotalArray) {
    // Use provided baseline or calculate from 7-day data
    let baseline = baselineStepsMu || 8000; // Default baseline

    // Calculate 7-day total for baseline validation
    const steps7dTotal = (steps7dTotalArray || []).reduce((acc, steps) => {
        acc += steps || 0;
        return acc;
    }, 0);

    // If we have sufficient 7-day data, use weighted average as baseline
    if (steps7dTotal > (baseline * 5)) {
        // Using simplified weighted average (more recent days weighted higher)
        // Weights: [1, 1, 1, 1, 2, 2, 3] for 7 days, normalized to /11

        const totalWeightSteps = [1, 1, 1, 1, 2, 2, 3].reduce((acc, weight, index) => {
            acc += (weight * (steps7dTotalArray[index] || 0)) || 0;
            return acc;
        }, 0);
        baseline = Math.round(totalWeightSteps / 11);
    }

    const x = stepsTodayX;
    const mu = baseline;
    const sigma = sigmaInput || 2000; // Default standard deviation

    let stepsScore;
    let normDeviation;

    if (x >= mu) {
        stepsScore = 100;
        normDeviation = (x - mu) / sigma;
    } else {
        // SS = 100 × e^(-(x - μ)^2 / (2σ^2))
        const exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
        stepsScore = 100 * Math.exp(exponent);
        normDeviation = (x - mu) / sigma;
    }

    return {
        value: Math.round(stepsScore), // stepsScore: 7.484286474863389
        normDeviation: Math.round(normDeviation * 100) / 100, // Round to 2 decimal places -- normDeviation: -2.277
        trend: null // Not calculated in this implementation
    };
}

/**
 * Compare calculated steps score with API result and provide analysis
 * @param {Object} calculatedScore - Our calculated steps score
 * @param {Object} apiScore - API's steps score
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareStepsScores(calculatedScore, apiScore, metrics) {
    if (!apiScore || apiScore.value === null) {
        return {
            available: false,
            message: 'API Steps Score not available for comparison'
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
            stepsTodayX: metrics.stepsTodayX,
            baselineStepsMu: metrics.baselineStepsMu,
            steps7dStdDev: metrics.steps7dStdDev,
            steps7dMean: metrics.steps7dMean
        },
        message: isWithinRange ?
            '✅ Steps score calculation matches API within acceptable range' :
            `⚠️ Steps score calculation differs significantly from API (diff: ${valueDiff})`
    };
}