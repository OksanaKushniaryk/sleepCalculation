/**
 * Total Energy Credit Score Calculation Test
 *
 * Uses a sigmoid function to combine current energy credit score with
 * rolling average for a smoothed total energy credit assessment.
 * 
 * Test Parameters:
 * - currentEnergyCredit: Today's energy credit score (33 points)
 * - rollingAverageEnergyCredit: Historical average energy score (73 points)
 * 
 * The sigmoid function prevents dramatic daily swings in energy assessment
 * by balancing current performance with historical trends. This creates
 * a more stable and reliable energy credit evaluation over time.
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateTotalEnergyCreditScore} from "../total-energy-credit-score.js";

/**
 * Mock test function for Total Energy Credit Score calculation
 * 
 * This test simulates a scenario where current performance (33) is
 * significantly lower than the historical average (73), demonstrating
 * how the sigmoid smoothing function prevents extreme score fluctuations.
 * 
 * @returns {Promise} Result object containing total energy credit score and metadata
 */
export const mockTotalEnergyCreditScoreTest = async () => {
    // Simulate async delay for testing purposes
    await sleep(2000);
    
    // Test case: Current performance below historical average
    // Parameters explained:
    // - 33: Current day's energy credit (below average performance)
    // - 73: Rolling average energy credit over past period (good historical performance)
    //
    // This scenario tests the sigmoid function's ability to:
    // 1. Acknowledge the poor current performance
    // 2. Factor in good historical context
    // 3. Provide a balanced, smoothed score
    // 4. Prevent dramatic day-to-day score swings
    const result = calculateTotalEnergyCreditScore(33, 73);

    console.info('calculate Total Energy Credit Score =', result);

    return result;
}
mockTotalEnergyCreditScoreTest();