/**
 * Consistency Score Calculation Test
 *
 * Measures how consistent your step count is across the past 7 days.
 * Less deviation = better health patterns.
 * 
 * Test Parameters:
 * - stepCounts: Array of 7 daily step counts [2502, 3446, 4383, 7187, 6375, 4733, 3446]
 * - target: Daily step target goal (4581 steps)
 * - baseline: Minimum step baseline threshold (1557 steps)
 * 
 * The function calculates consistency by measuring deviation from the average
 * and comparing against target and baseline values for scoring.
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateConsistencyScore} from "../consistency-score.js";

/**
 * Mock test function for Consistency Score calculation
 * 
 * This test demonstrates three different parameter combinations:
 * 1. With stepCounts only (no target/baseline) - commented out
 * 2. With stepCounts and target only - commented out  
 * 3. With all parameters (stepCounts, target, baseline) - active test
 * 
 * @returns {Promise} Result object containing consistency score and metadata
 */
export const mockConsistencyScoreTest = async () => {
    // Simulate async delay for testing purposes
    await sleep(2000);
    
    // Test Case 1: Basic calculation with step counts only
    // const result = calculateConsistencyScore([2502, 3446, 4383, 7187, 6375, 4733, 3446], null, null);
    
    // Test Case 2: With step counts and target goal
    // const result = calculateConsistencyScore([2502, 3446, 4383, 7187, 6375, 4733, 3446], 4581, null);
    
    // Test Case 3: Full parameter test - step counts, target, and baseline
    // Parameters explained:
    // - [2502, 3446, 4383, 7187, 6375, 4733, 3446]: 7-day step history
    // - 4581: Target daily step goal
    // - 1557: Baseline minimum steps threshold
    const result = calculateConsistencyScore([2502, 3446, 4383, 7187, 6375, 4733, 3446], 4581, 1557);

    console.info('calculate Consistency Score =', result);

    return result;
}
mockConsistencyScoreTest();