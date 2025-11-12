/**
 * Total Energy Credit Score Calculation
 *
 * Uses a sigmoid function to combine current energy credit score with
 * rolling average for a smoothed total energy credit assessment.
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateTotalEnergyCreditScore} from "../total-energy-credit-score.js";

export const mockTotalEnergyCreditScoreTest = async () => {
    await sleep(2000);
    /// real test
    const result = calculateTotalEnergyCreditScore(33, 73);

    console.info('calculate Total Energy Credit Score =', result);

    return result;
}
mockTotalEnergyCreditScoreTest();