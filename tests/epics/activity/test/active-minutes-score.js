/**
 * Active Minutes Score Calculation Test
 * 
 * Tracks minutes of moderate-to-vigorous physical activity (MVPA) compared 
 * to recommended targets based on age group.
 * 
 * Test Parameters:
 * - fairlyActiveMinutes: Minutes of moderate intensity activity (0 minutes)
 * - veryActiveMinutes: Minutes of vigorous intensity activity (0 minutes)
 * - age: User's age for activity recommendations (30 years old)
 * - ageGroup: Age category for targeted recommendations ('adult')
 * 
 * The WHO recommends 150+ minutes of moderate or 75+ minutes of vigorous
 * activity per week. This test simulates a sedentary day (0 active minutes).
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateActiveMinutesScore} from "../active-minutes-score.js";

/**
 * Mock test function for Active Minutes Score calculation
 * 
 * This test simulates a completely sedentary day to test the scoring
 * algorithm's behavior when no moderate or vigorous activity is recorded.
 * Useful for understanding baseline scoring and penalty calculations.
 * 
 * @returns {Promise} Result object containing active minutes score and metadata
 */
export const mockActivityMinutesScoreTest = async () => {
    // Simulate async delay for testing purposes
    await sleep(2000);
    
    // Test case: Completely sedentary day
    // Parameters explained:
    // - 0: Fairly active minutes (moderate intensity, 3-6 METs)
    // - 0: Very active minutes (vigorous intensity, 6+ METs)
    // - 30: User age (affects recommended activity targets)
    // - 'adult': Age group category (adult vs senior vs child recommendations)
    //
    // This tests the lower bound of the scoring algorithm - what happens
    // when a user has zero recorded activity for the day
    const result = calculateActiveMinutesScore(0, 0, 30, 'adult');

    console.info('calculate Active Minutes Score =', result);

    return result;
}
mockActivityMinutesScoreTest();