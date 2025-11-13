/**
 * Steps Score Calculation Test
 *
 * Implements the OneVital Steps Score formula that quantifies how close
 * the user is to their daily step goal or baseline.
 * 
 * Test Parameters:
 * - currentSteps: Today's step count (3446 steps)
 * - stepGoal: Daily step target goal (8000 steps)
 * - stepBaseline: Minimum acceptable step count (2000 steps)
 * - stepHistory: Array of past 7 days step counts for context
 * 
 * The scoring algorithm considers current performance relative to both
 * the ambitious goal and minimum baseline for balanced assessment.
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateStepsScore} from "../steps-score.js";

/**
 * Mock test function for Steps Score calculation
 * 
 * This test demonstrates two scenarios:
 * 1. Normal step count (3446) - below goal but above baseline
 * 2. Higher step count scenario - commented out for comparison
 * 
 * @returns {Promise} Result object containing step score and metadata
 */
export const mockStepsScoreTest = async () => {
    // Simulate async delay for testing purposes
    await sleep(2000);
    
    // Main test case: User with moderate step count
    // Parameters explained:
    // - 3446: Current day steps (below 8000 goal, above 2000 baseline)
    // - 8000: Daily step goal target
    // - 2000: Minimum baseline threshold
    // - [2502, 3446, 4383, 7187, 6375, 4733, 3446]: 7-day step history for context
    const result = calculateStepsScore(3446, 8000, 2000, [2502, 3446, 4383, 7187, 6375, 4733, 3446]);

    // Alternative test case: Higher performing user (for formula validation)
    // This tests the scoring when historical data shows higher step counts
    // - Same current steps (3446) but with higher historical performance
    // - [7502, 6446, 4383, 7187, 6375, 4733, 3446]: Higher step history
    // const result = calculateStepsScore(3446, 8000, 2000, [7502, 6446, 4383, 7187, 6375, 4733, 3446]);

    console.info('calculate Steps Score =', result);

    return result;
}
mockStepsScoreTest();