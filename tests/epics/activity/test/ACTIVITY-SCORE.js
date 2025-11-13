/**
 * Final Activity Score Calculation Test
 *
 * Combines all individual activity metrics into a weighted final activity score.
 * Uses the OneVital weighted formula combining Steps, Active Minutes, Consistency,
 * Gini Coefficient, and Total Energy Credit scores.
 * 
 * Test Process:
 * 1. Runs all individual activity tests in parallel
 * 2. Extracts score values from each test result
 * 3. Applies weighted formula to calculate final composite score
 * 
 * Component Scores:
 * - Steps Score: Daily step achievement vs goal/baseline
 * - Active Minutes Score: MVPA time vs age-appropriate targets
 * - Consistency Score: 7-day step count variance
 * - Activity Level Consistency: Hourly step distribution (Gini coefficient)
 * - Total Energy Credit: Sigmoid-smoothed energy assessment
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateFinalActivityScore} from "../final-activity-score.js";
import {mockStepsScoreTest} from "./steps-score.js";
import {mockActivityMinutesScoreTest} from "./active-minutes-score.js";
import {mockConsistencyScoreTest} from "./consistency-score.js";
import {mockActivityLevelConsistencyScoreTest} from "./activity-level-consistency.js";
import {mockTotalEnergyCreditScoreTest} from "./total-energy-credit-score.js";

/**
 * Mock test function for Final Activity Score calculation
 * 
 * This comprehensive test orchestrates all individual activity score calculations
 * and combines them using the OneVital weighted formula. It demonstrates the
 * complete pipeline from raw activity data to final holistic score.
 * 
 * Execution Flow:
 * 1. Parallel execution of all component tests for efficiency
 * 2. Extraction of numeric score values from test results
 * 3. Weighted combination using final activity score algorithm
 * 4. Output of comprehensive final score
 * 
 * @returns {Promise} Result object containing final weighted activity score
 */
export const mockFinalActivityScoreTest = async () => {
    // Simulate async delay for testing purposes
    await sleep(2000);

    // Execute all individual activity score tests in parallel
    // This is efficient and demonstrates real-world usage where multiple
    // metrics would be calculated simultaneously from user data
    const [stepsScore,
        activeMinutesScore,
        consistencyScore,
        activityLevelConsistencyScore,
        totalEnergyCreditScore] = await Promise.all([
        mockStepsScoreTest(),           // Daily step achievement
        mockActivityMinutesScoreTest(), // MVPA minutes tracking
        mockConsistencyScoreTest(),     // 7-day step consistency
        mockActivityLevelConsistencyScoreTest(), // Hourly distribution
        mockTotalEnergyCreditScoreTest()         // Energy credit assessment
    ]);

    // Combine all component scores using weighted formula
    // Each score contributes differently to the final assessment
    // based on OneVital's activity scoring methodology
    const result = calculateFinalActivityScore(
        stepsScore?.value,                    // Weight: Primary daily metric
        activeMinutesScore?.value,            // Weight: Intensity-based metric
        consistencyScore?.value,              // Weight: Behavioral consistency
        activityLevelConsistencyScore?.value, // Weight: Distribution quality
        totalEnergyCreditScore?.value,        // Weight: Energy balance
    )

    console.info('calculate Final Activity Score =', result);

    return result;
}
mockFinalActivityScoreTest();