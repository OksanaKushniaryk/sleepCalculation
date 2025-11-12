/**
 * Activity Level Consistency Calculation
 * 
 * Measures how steps are distributed throughout the day using Gini coefficient.
 * Low Gini = evenly spread steps = good
 * High Gini = clumped activity = not good
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateActivityLevelConsistencyScore} from "../activity-level-consistency.js";

export const mockActivityLevelConsistencyScoreTest = async () => {
    await sleep(2000);
    /// real test
    // const result = calculateActivityLevelConsistencyScore([500, 520, 480, 510, 530], 0.02);
    const result = calculateActivityLevelConsistencyScore([500, 520, 480, 510, 530], undefined);

    console.info('calculate Activity Level Consistency Score =', result);

    return result;
}
mockActivityLevelConsistencyScoreTest();