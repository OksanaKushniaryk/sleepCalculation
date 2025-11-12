/**
 * Active Minutes Score Calculation
 * 
 * Tracks minutes of moderate-to-vigorous physical activity (MVPA) compared 
 * to recommended targets based on age group.
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateActiveMinutesScore} from "../active-minutes-score.js";

export const mockActivityMinutesScoreTest = async () => {
    await sleep(2000);
    /// real test
    const result = calculateActiveMinutesScore(2, 9, null, 'adult');

    console.info('calculate Active Minutes Score =', result);

    return result;
}
mockActivityMinutesScoreTest();