/**
 * Steps Score Calculation
 * 
 * Implements the OneVital Steps Score formula that quantifies how close 
 * the user is to their daily step goal or baseline.
 */

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

/**
 * Calculate Steps Score based on OneVital formula
 * @param {Object} metrics - Metrics object containing step data
 * @returns {Object} Steps score with value, normDeviation, and trend
 */
export async function calculateStepsScore(stepsTodayX, baselineStepsMu, steps7dStdDev, steps7dMean) {
    await sleep(2000);
    // Use provided baseline or calculate from 7-day data
    let baseline = baselineStepsMu || 8000; // Default baseline
    
    // Calculate 7-day total for baseline validation
    const steps7dTotal = steps7dMean * 7;
    
    // If we have sufficient 7-day data, use weighted average as baseline
    if (steps7dTotal > (baseline * 5)) {
        // Using simplified weighted average (more recent days weighted higher)
        // Weights: [1, 1, 1, 1, 2, 2, 3] for 7 days, normalized to /11
        // todo: we need to calculate new baseline = [1 * stepsTodayX, 1 * stepsTodayX, 1 * stepsTodayX, 1 * stepsTodayX, 2 * stepsTodayX, 2 * stepsTodayX, 3 * stepsTodayX] / 11
        baseline = steps7dMean; // Simplified to use mean for this implementation
    }

    const x = stepsTodayX;
    const mu = baseline;
    const sigma = steps7dStdDev || 2000; // Default standard deviation

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
        value: Math.round(stepsScore),
        normDeviation: Math.round(normDeviation * 100) / 100, // Round to 2 decimal places
        trend: null // Not calculated in this implementation
    };
}

const result = await calculateStepsScore(4000, 8000, 2000, 5248);

console.info('calculate Steps Score =', result);

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