/**
 * Basal Metabolic Rate (BMR) Calculation
 *
 * BMR accounts for ~60-75% of total energy expenditure. Uses the Mifflin-St Jeor equation
 * with dynamic adjustments based on physiological data (sleep, stress, time of day).
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateBasalMetabolicRate} from "../basal-metabolic-rate.js";

export const mockBasalMetabolicRateTest = async () => {
    await sleep(2000);
    /// real test
    const result = calculateBasalMetabolicRate(90, 185, 30, 'male', 75, 50, 12);

    console.info('calculate Basal Metabolic Rate =', result);

    return result;
}
mockBasalMetabolicRateTest();