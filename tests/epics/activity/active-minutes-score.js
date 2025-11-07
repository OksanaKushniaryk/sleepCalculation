/**
 * Active Minutes Score Calculation
 * 
 * Tracks minutes of moderate-to-vigorous physical activity (MVPA) compared 
 * to recommended targets based on age group.
 */

import {sleep} from "../../utils/async-helper.js";

/**
 * Calculate Active Minutes Score based on OneVital formula
 * @param {number} mvpaMinutesToday - Today's MVPA minutes
 * @param {number} mvpaRecentMean - Recent 7-day average MVPA
 * @param {number} mvpaMinRecommendedByAge - Minimum recommended MVPA by age
 * @param {string} ageGroup - Age group ("adult", "child", "older_adult")
 * @returns {Object} Active minutes score with value, normDeviation, and trend
 */
export function calculateActiveMinutesScore(mvpaMinutesToday, mvpaRecentMean, mvpaMinRecommendedByAge, ageGroup) {
    // Calculate weighted 7-day average (μ_recent)
    const muRecent = mvpaRecentMean || 0;
    
    // Get minimum recommended by age (from table in formula)
    let minRecommendedByAge = mvpaMinRecommendedByAge;
    if (!minRecommendedByAge) {
        // Default recommendations based on age group
        switch (ageGroup) {
            case 'child':
                minRecommendedByAge = 60; // 60 min/day for children (5-17)
                break;
            case 'adult':
            case 'older_adult':
                minRecommendedByAge = 21.4; // 150 min/week → 21.4/day for adults (18-64) and older adults (65+)
                break;
            default:
                minRecommendedByAge = 21.4; // Default to adult recommendation
        }
    }
    
    // Calculate μ_m = max(μ_recent, min_recommended_by_age)
    const muM = Math.max(muRecent, minRecommendedByAge);
    
    // Standard deviation tolerance (σ_m) - typically 15 min according to formula
    const sigmaM = 15;
    
    // Today's total MVPA minutes
    const m = mvpaMinutesToday || 0;
    
    // Final Formula: S_ActiveMinScore = 100 × e^(-(m - μ_m)^2 / (2σ_m^2))
    const exponent = -Math.pow(m - muM, 2) / (2 * Math.pow(sigmaM, 2));
    const activeMinutesScore = 100 * Math.exp(exponent);
    
    // Calculate normalization deviation
    const normDeviation = (m - muM) / sigmaM;
    
    return {
        value: Math.round(activeMinutesScore),
        normDeviation: Math.round(normDeviation * 100) / 100, // Round to 2 decimal places
        trend: null // Not calculated in this implementation
    };
}


export const mockActivityMinutesScoreTest = async () => {
    await sleep(2000);
    /// real test
    const result = calculateActiveMinutesScore(2, 9, null, 'adult');

    console.info('calculate Active Minutes Score =', result);

    return result;
}
mockActivityMinutesScoreTest();

/**
 * Compare calculated active minutes score with API result and provide analysis
 * @param {Object} calculatedScore - Our calculated active minutes score
 * @param {Object} apiScore - API's active minutes score
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareActiveMinutesScores(calculatedScore, apiScore, metrics) {
    if (!apiScore || apiScore.value === null) {
        return {
            available: false,
            message: 'API Active Minutes Score not available for comparison'
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
            mvpaMinutesToday: metrics.mvpaMinutesToday_m,
            mvpaRecentMean: metrics.mvpaRecentMean,
            mvpaMinRecommendedByAge: metrics.mvpaMinRecommendedByAge,
            ageGroup: metrics.ageGroup
        },
        message: isWithinRange ? 
            '✅ Active Minutes score calculation matches API within acceptable range' :
            `⚠️ Active Minutes score calculation differs significantly from API (diff: ${valueDiff})`
    };
}