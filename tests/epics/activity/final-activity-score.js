/**
 * Final Activity Score Calculation
 *
 * Combines all individual activity metrics into a weighted final activity score.
 * Uses the OneVital weighted formula combining Steps, Active Minutes, Consistency,
 * Gini Coefficient, and Total Energy Credit scores.
 */

import {sleep} from "../../utils/async-helper.js";
import {mockStepsScoreTest} from "./steps-score.js";
import {mockActivityMinutesScoreTest} from "./active-minutes-score.js";
import {mockConsistencyScoreTest} from "./consistency-score.js";
import {mockActivityLevelConsistencyScoreTest} from "./activity-level-consistency.js";
import {mockTotalEnergyCreditScoreTest} from "./total-energy-credit-score.js";

/**
 * Calculate Final Activity Score based on OneVital weighted formula
 * @param {number} stepsScore - Steps Score (0-100)
 * @param {number} activeMinutesScore - Active Minutes Score (0-100)
 * @param {number} consistencyScore - Consistency Score (0-100)
 * @param {number} activityLevelConsistencyScore - Gini Coefficient Score (0-100)
 * @param {number} totalEnergyCreditScore - Total Energy Credit Score (0-100)
 * @param {Object} options - Configuration options for weights
 * @returns {Object} Final activity score with value, components, and trend
 */
export function calculateFinalActivityScore(
    stepsScore,
    activeMinutesScore,
    consistencyScore,
    activityLevelConsistencyScore,
    totalEnergyCreditScore,
) {
    // Default weights from OneVital formula
    let weights = {
        stepsScore: 0.25,           // 25%
        activeMinutesScore: 0.25,  // 25%
        consistencyScore: 0.15,     // 15%
        activityLevelConsistencyScore: 0.10,  // 10%
        totalEnergyCreditScore: 0.25  // 25%
    };

    if (!consistencyScore && consistencyScore !== 0 && !totalEnergyCreditScore && totalEnergyCreditScore !== 0) {
        weights = {
            stepsScore: 0.385,           // 38.5%
            activeMinutesScore: 0.385,  // 38.5%
            consistencyScore: 0,
            activityLevelConsistencyScore: 0.23,  // 23%
            totalEnergyCreditScore: 0
        };
    } else if (!consistencyScore && consistencyScore !== 0) {
        weights = {
            stepsScore: 0.294,           // 29.4%
            activeMinutesScore: 0.294,  // 29.4%
            consistencyScore: 0,
            activityLevelConsistencyScore: 0.118,  // 10%
            totalEnergyCreditScore: 0.294  // 29.4%
        };
    } else if (!totalEnergyCreditScore && totalEnergyCreditScore !== 0) {
        weights = {
            stepsScore: 0.333,           // 33.3%
            activeMinutesScore: 0.333,  // 33.3%
            consistencyScore: 0.2,     // 20%
            activityLevelConsistencyScore: 0.134,  // 13.4%
            totalEnergyCreditScore: 0
        };
    }

    // Handle default values for missing scores
    const ss = stepsScore || 0;
    const ams = activeMinutesScore || 0;
    const cs = consistencyScore || 0;
    const gcs = activityLevelConsistencyScore || 0;
    const tecs = totalEnergyCreditScore || 0;

    // Calculate weighted activity score
    // Activity score = 0.25 * SS + 0.25 * AMS + 0.15 * CS + 0.1 * GCS + 0.25 * TECS
    const finalActivityScore =
        weights.stepsScore * ss +
        weights.activeMinutesScore * ams +
        weights.consistencyScore * cs +
        weights.activityLevelConsistencyScore * gcs +
        weights.totalEnergyCreditScore * tecs;

    // Ensure score is within 0-100 bounds
    const boundedScore = Math.max(0, Math.min(100, finalActivityScore));

    return {
        value: Math.round(boundedScore * 100) / 100, // Round to 2 decimal places
        components: {
            stepsScore: {value: ss, weight: weights.stepsScore, contribution: weights.stepsScore * ss},
            activeMinutesScore: {
                value: ams,
                weight: weights.activeMinutesScore,
                contribution: weights.activeMinutesScore * ams
            },
            consistencyScore: {
                value: cs,
                weight: weights.consistencyScore,
                contribution: weights.consistencyScore * cs
            },
            activityLevelConsistencyScore: {
                value: gcs,
                weight: weights.activityLevelConsistencyScore,
                contribution: weights.activityLevelConsistencyScore * gcs
            },
            totalEnergyCreditScore: {
                value: tecs,
                weight: weights.totalEnergyCreditScore,
                contribution: weights.totalEnergyCreditScore * tecs
            }
        },
        weights: weights,
        trend: null // Not calculated in this implementation
    };
}

export const mockFinalActivityScoreTest = async () => {
    await sleep(2000);
    /// real test

    const [stepsScore,
        activeMinutesScore,
        consistencyScore,
        activityLevelConsistencyScore,
        totalEnergyCreditScore] = await Promise.all([
        mockStepsScoreTest(),
        mockActivityMinutesScoreTest(),
        mockConsistencyScoreTest(),
        mockActivityLevelConsistencyScoreTest(),
        mockTotalEnergyCreditScoreTest()]);

    const result = calculateFinalActivityScore(
        stepsScore?.value,
        activeMinutesScore?.value,
        consistencyScore?.value,
        activityLevelConsistencyScore?.value,
        totalEnergyCreditScore?.value,
    )

    console.info('calculate Final Activity Score =', result);

    return result;
}
mockFinalActivityScoreTest();


/**
 * Compare calculated final activity score with API result and provide analysis
 * @param {Object} calculatedScore - Our calculated final activity score
 * @param {Object} apiScore - API's final activity score
 * @param {Object} componentScores - Individual component scores used
 * @returns {Object} Comparison analysis
 */
export function compareFinalActivityScores(calculatedScore, apiScore, componentScores) {
    if (!apiScore || apiScore.value === null) {
        return {
            available: false,
            message: 'API Final Activity Score not available for comparison'
        };
    }

    const valueDiff = Math.abs(calculatedScore.value - apiScore.value);
    const isWithinRange = valueDiff <= 5; // Allow 5 point difference

    return {
        available: true,
        valueDiff,
        isWithinRange,
        calculatedScore,
        apiScore,
        componentScores: {
            stepsScore: componentScores.stepsScore,
            activeMinutesScore: componentScores.activeMinutesScore,
            consistencyScore: componentScores.consistencyScore,
            activityLevelConsistencyScore: componentScores.activityLevelConsistencyScore,
            totalEnergyCreditScore: componentScores.totalEnergyCreditScore
        },
        weightedContributions: calculatedScore.components,
        message: isWithinRange ?
            '✅ Final Activity score calculation matches API within acceptable range' :
            `⚠️ Final Activity score calculation differs significantly from API (diff: ${valueDiff})`
    };
}