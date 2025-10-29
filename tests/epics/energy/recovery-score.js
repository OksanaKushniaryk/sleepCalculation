/**
 * Recovery Score Calculation
 * 
 * The Recovery Score quantifies how well the body is prepared for stress and activity.
 * It is derived from two components: HRV Score and Sleep Score.
 * 
 * Formula: RecoveryScore = (w1 × HRV_score + w2 × SleepScore) / (w1 + w2)
 * Where: w1, w2 = weights for HRV and Sleep (e.g., w1 = 0.6, w2 = 0.4)
 */

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