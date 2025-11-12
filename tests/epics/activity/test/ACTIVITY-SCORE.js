/**
 * Final Activity Score Calculation
 *
 * Combines all individual activity metrics into a weighted final activity score.
 * Uses the OneVital weighted formula combining Steps, Active Minutes, Consistency,
 * Gini Coefficient, and Total Energy Credit scores.
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateFinalActivityScore} from "../final-activity-score.js";
import {mockStepsScoreTest} from "./steps-score.js";
import {mockActivityMinutesScoreTest} from "./active-minutes-score.js";
import {mockConsistencyScoreTest} from "./consistency-score.js";
import {mockActivityLevelConsistencyScoreTest} from "./activity-level-consistency.js";
import {mockTotalEnergyCreditScoreTest} from "./total-energy-credit-score.js";

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