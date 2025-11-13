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

export const mockFinalActivityScoreIntegrationTest = async () => {
    await sleep(1000);
    
    console.info('🔗 Final Activity Score Integration Test - Using calculated component scores');
    
    // Calculate each component score directly with realistic data
    console.info('\n📊 Calculating Individual Activity Components:');
    
    // 1. Steps Score - using realistic step data
    console.info('   → Calculating Steps Score...');
    const dailySteps = 6500;
    const stepGoal = 8000;
    const stepBaseline = 3000;
    const stepHistory = [5800, 7200, 4500, 6800, 5900, 7500, 6200]; // 7-day history
    
    const { calculateStepsScore } = await import('../steps-score.js');
    const stepsResult = calculateStepsScore(dailySteps, stepGoal, stepBaseline, stepHistory);
    console.info('     Steps Score:', stepsResult.value, '(', dailySteps, 'of', stepGoal, 'goal)');
    
    // 2. Active Minutes Score
    console.info('   → Calculating Active Minutes Score...');
    const fairlyActiveMinutes = 25;
    const veryActiveMinutes = 15;
    const userAge = 32;
    const ageGroup = 'adult';
    
    const { calculateActiveMinutesScore } = await import('../active-minutes-score.js');
    const activeMinutesResult = calculateActiveMinutesScore(fairlyActiveMinutes, veryActiveMinutes, userAge, ageGroup);
    console.info('     Active Minutes Score:', activeMinutesResult.value, '(', fairlyActiveMinutes + veryActiveMinutes, 'total active minutes)');
    
    // 3. Consistency Score
    console.info('   → Calculating Consistency Score...');
    const { calculateConsistencyScore } = await import('../consistency-score.js');
    const consistencyResult = calculateConsistencyScore(stepHistory, stepGoal, stepBaseline);
    console.info('     Consistency Score:', consistencyResult.value, '(7-day step variance)');
    
    // 4. Activity Level Consistency Score (Gini coefficient)
    console.info('   → Calculating Activity Level Consistency...');
    const hourlySteps = [420, 380, 450, 520, 380, 600, 580, 490, 380, 420]; // 10-hour sample
    const { calculateActivityLevelConsistencyScore } = await import('../activity-level-consistency.js');
    const activityLevelResult = calculateActivityLevelConsistencyScore(hourlySteps);
    console.info('     Activity Level Consistency:', activityLevelResult.value, '(hourly step distribution)');
    
    // 5. Total Energy Credit Score
    console.info('   → Calculating Total Energy Credit Score...');
    const currentEnergyCredit = 65; // Today's energy score
    const rollingAvgEnergyCredit = 70; // 7-day average
    const { calculateTotalEnergyCreditScore } = await import('../total-energy-credit-score.js');
    const energyCreditResult = calculateTotalEnergyCreditScore(currentEnergyCredit, rollingAvgEnergyCredit);
    console.info('     Total Energy Credit Score:', energyCreditResult.value, '(sigmoid smoothed)');
    
    // Now calculate Final Activity Score using all calculated components
    console.info('\n🎯 Calculating Final Activity Score...');
    const finalResult = calculateFinalActivityScore(
        stepsResult.value,           // Using calculated steps score
        activeMinutesResult.value,   // Using calculated active minutes score  
        consistencyResult.value,     // Using calculated consistency score
        activityLevelResult.value,   // Using calculated activity level score
        energyCreditResult.value     // Using calculated energy credit score
    );
    
    console.info('🏆 Final Activity Score (Integration):', finalResult.value);
    console.info('\n📈 Component Breakdown:');
    console.info('   Steps Score:', stepsResult.value, '(weight: 25%)');
    console.info('   Active Minutes:', activeMinutesResult.value, '(weight: 25%)');
    console.info('   Consistency:', consistencyResult.value, '(weight: 15%)');
    console.info('   Activity Distribution:', activityLevelResult.value, '(weight: 10%)');
    console.info('   Energy Credit:', energyCreditResult.value, '(weight: 25%)');
    
    // Calculate weighted contribution of each component
    const weights = {
        steps: 0.25,
        activeMinutes: 0.25,
        consistency: 0.15,
        activityLevel: 0.10,
        energyCredit: 0.25
    };
    
    console.info('\n⚖️ Weighted Contributions:');
    console.info('   Steps:', (stepsResult.value * weights.steps).toFixed(1), 'points');
    console.info('   Active Minutes:', (activeMinutesResult.value * weights.activeMinutes).toFixed(1), 'points');
    console.info('   Consistency:', (consistencyResult.value * weights.consistency).toFixed(1), 'points');
    console.info('   Distribution:', (activityLevelResult.value * weights.activityLevel).toFixed(1), 'points');
    console.info('   Energy Credit:', (energyCreditResult.value * weights.energyCredit).toFixed(1), 'points');
    
    // Activity interpretation
    let interpretation;
    if (finalResult.value >= 80) {
        interpretation = 'Excellent activity profile - well-balanced across all metrics';
    } else if (finalResult.value >= 70) {
        interpretation = 'Good activity profile - minor areas for improvement';
    } else if (finalResult.value >= 60) {
        interpretation = 'Moderate activity profile - several areas need attention';
    } else if (finalResult.value >= 50) {
        interpretation = 'Below average activity - significant improvement needed';
    } else {
        interpretation = 'Poor activity profile - major lifestyle changes recommended';
    }
    
    console.info('\n💡 Activity Assessment:', interpretation);
    
    return {
        finalActivityScore: finalResult,
        components: {
            steps: stepsResult,
            activeMinutes: activeMinutesResult,
            consistency: consistencyResult,
            activityLevel: activityLevelResult,
            energyCredit: energyCreditResult
        },
        inputData: {
            dailySteps,
            stepGoal,
            stepBaseline,
            stepHistory,
            fairlyActiveMinutes,
            veryActiveMinutes,
            userAge,
            hourlySteps,
            currentEnergyCredit,
            rollingAvgEnergyCredit
        },
        weightedContributions: {
            steps: stepsResult.value * weights.steps,
            activeMinutes: activeMinutesResult.value * weights.activeMinutes,
            consistency: consistencyResult.value * weights.consistency,
            activityLevel: activityLevelResult.value * weights.activityLevel,
            energyCredit: energyCreditResult.value * weights.energyCredit
        },
        interpretation
    };
};
// mockFinalActivityScoreIntegrationTest();