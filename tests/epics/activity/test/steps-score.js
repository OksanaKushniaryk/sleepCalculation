/**
 * Steps Score Calculation
 *
 * Implements the OneVital Steps Score formula that quantifies how close
 * the user is to their daily step goal or baseline.
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateStepsScore} from "../steps-score.js";

export const mockStepsScoreTest = async () => {
    await sleep(2000);
    /// real test
    const result = calculateStepsScore(3446, 8000, 2000, [2502, 3446, 4383, 7187, 6375, 4733, 3446]);

    /// more than baseline (to check formula)
    // const result = calculateStepsScore(3446, 8000, 2000, [7502, 6446, 4383, 7187, 6375, 4733, 3446]);

    console.info('calculate Steps Score =', result);

    return result;
}
mockStepsScoreTest();