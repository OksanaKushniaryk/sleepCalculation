/**
 * Activity Level Consistency Calculation Test
 * 
 * Measures how steps are distributed throughout the day using Gini coefficient.
 * Low Gini = evenly spread steps = good health pattern
 * High Gini = clumped activity = suboptimal pattern
 * 
 * Test Parameters:
 * - hourlySteps: Array of steps per hour [500, 520, 480, 510, 530]
 * - giniCoefficient: Optional pre-calculated Gini value (undefined to auto-calculate)
 * 
 * The Gini coefficient (0-1 scale) measures inequality in step distribution:
 * - 0 = perfectly even distribution (ideal)
 * - 1 = all steps in single hour (worst)
 * - Target: <0.5 for good activity distribution
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateActivityLevelConsistencyScore} from "../activity-level-consistency.js";

/**
 * Mock test function for Activity Level Consistency Score calculation
 * 
 * This test demonstrates three scenarios for Gini coefficient calculation:
 * 1. With hourly data and pre-calculated Gini - commented out
 * 2. With hourly data, auto-calculate Gini - active test
 * 3. Empty hourly data with manual Gini - commented out
 * 
 * @returns {Promise} Result object containing consistency score and metadata
 */
export const mockActivityLevelConsistencyScoreTest = async () => {
    // Simulate async delay for testing purposes
    await sleep(2000);
    
    // Test Case 1: With hourly steps and pre-calculated Gini coefficient
    // Shows how the function behaves when Gini is already known
    // const result = calculateActivityLevelConsistencyScore([500, 520, 480, 510, 530], 0.02);
    
    // Test Case 2: Auto-calculate Gini from hourly step data (ACTIVE TEST)
    // Parameters explained:
    // - [500, 520, 480, 510, 530]: Steps recorded for each hour (5-hour sample)
    // - undefined: Let function calculate Gini coefficient automatically
    //
    // This data shows relatively even distribution (low Gini expected)
    // which should result in a good consistency score
    const result = calculateActivityLevelConsistencyScore([500, 520, 480, 510, 530], undefined);
    
    // Test Case 3: Edge case - empty hourly data with manual Gini
    // Tests how function handles missing step data but known inequality
    // - []: No hourly step data available
    // - 3.65: High Gini coefficient (poor distribution)
    // const result = calculateActivityLevelConsistencyScore([], 3.65);

    console.info('calculate Activity Level Consistency Score =', result);

    return result;
}
mockActivityLevelConsistencyScoreTest();