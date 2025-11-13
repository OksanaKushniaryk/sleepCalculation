/**
 * Resting Heart Rate (RHR) Calculation for 30-minute periods
 *
 * RHR estimation based on heart rate readings and activity level (steps).
 * If steps < 300 in 30 minutes, user is considered at rest.
 * RHR is calculated as average of heart rate readings during rest periods.
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateRHRfor30min} from "../RHR-for-30-min.js";

export const mockRHRTest = async () => {
    await sleep(2000);
    /// real test
    const result = calculateRHRfor30min([120, 85, 60, 53, 14, 134, 120, 85, 60, 53, 14, 134, 120, 85, 60, 53, 14, 134, 120, 85, 60, 53, 14, 134], 1864);

    console.info('calculate RHR =', result);

    return result;
}
mockRHRTest();