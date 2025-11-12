/**
 * Consistency Score Calculation
 *
 * Measures how consistent your step count is across the past 7 days.
 * Less deviation = better health patterns.
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateConsistencyScore} from "../consistency-score.js";

export const mockConsistencyScoreTest = async () => {
    await sleep(2000);
    /// real test
    // const result = calculateConsistencyScore([2502, 3446, 4383, 7187, 6375, 4733, 3446], null, null);
    // const result = calculateConsistencyScore([2502, 3446, 4383, 7187, 6375, 4733, 3446], 4581, null);
    const result = calculateConsistencyScore([2502, 3446, 4383, 7187, 6375, 4733, 3446], 4581, 1557);

    console.info('calculate Consistency Score =', result);

    return result;
}
mockConsistencyScoreTest();