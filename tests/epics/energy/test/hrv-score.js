/**
 * HRV Score Calculation
 *
 * HRV Score uses Gaussian distribution to evaluate Heart Rate Variability relative to baseline.
 * Formula: HRV_score = 100 × e^(-(μ - x)^2 / (2 × σ^2)) if x < μ, otherwise 100
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateHRVScore} from "../hrv-score.js";

export const mockHRVScoreTest = async () => {
    await sleep(2000);

    const result = calculateHRVScore(25, 30, 15, 'general');

    console.info('calculate HRV Score =', result);

    return result;
}

mockHRVScoreTest();