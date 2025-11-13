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

export const mockTotalEnergyCreditScoreIntegrationTest = async () => {
    await sleep(1000);
    
    console.info('🔗 Total Energy Credit Score Integration Test - Using calculated rolling averages');
    
    // Simulate 7 days of historical energy credit scores
    const historicalEnergyScores = [
        78, // 6 days ago
        82, // 5 days ago  
        65, // 4 days ago
        75, // 3 days ago
        88, // 2 days ago
        70, // 1 day ago
        92  // today (most recent)
    ];
    
    console.info('   Historical Energy Scores (7 days):', historicalEnergyScores);
    console.info('   Range: Min =', Math.min(...historicalEnergyScores), ', Max =', Math.max(...historicalEnergyScores));
    
    // Calculate weighted rolling average using the formula's helper function
    const { calculateWeightedRollingAverage } = await import('../total-energy-credit-score.js');
    const rollingAverage = calculateWeightedRollingAverage(historicalEnergyScores);
    console.info('   Calculated Rolling Average:', rollingAverage.toFixed(2), '(weighted with recent bias)');
    
    // Current day's energy credit score  
    const currentEnergyCredit = 58; // Today's score (below recent average)
    console.info('   Current Day Score:', currentEnergyCredit);
    
    // Calculate Total Energy Credit Score using calculated rolling average
    const result = calculateTotalEnergyCreditScore(currentEnergyCredit, rollingAverage);
    
    console.info('🎯 Total Energy Credit Score (Integration):', result.value);
    console.info('   Current Score Input:', currentEnergyCredit);
    console.info('   Rolling Average Input:', rollingAverage.toFixed(2));
    console.info('   Sigmoid Sum:', result.normDeviation);
    
    // Test different scenarios to show sigmoid behavior
    console.info('\n📊 Scenario Testing:');
    
    // Scenario 1: High current score
    const highCurrentScore = 95;
    const result1 = calculateTotalEnergyCreditScore(highCurrentScore, rollingAverage);
    console.info('   High Current (95):', result1.value, '- Sigmoid input:', (highCurrentScore + rollingAverage).toFixed(1));
    
    // Scenario 2: Low current score  
    const lowCurrentScore = 25;
    const result2 = calculateTotalEnergyCreditScore(lowCurrentScore, rollingAverage);
    console.info('   Low Current (25):', result2.value, '- Sigmoid input:', (lowCurrentScore + rollingAverage).toFixed(1));
    
    // Scenario 3: Score matching rolling average
    const matchingScore = Math.round(rollingAverage);
    const result3 = calculateTotalEnergyCreditScore(matchingScore, rollingAverage);
    console.info('   Matching Average (', matchingScore, '):', result3.value, '- Sigmoid input:', (matchingScore + rollingAverage).toFixed(1));
    
    // Show the smoothing effect of the sigmoid function
    console.info('\n📈 Sigmoid Smoothing Analysis:');
    console.info('   Raw Current Score:', currentEnergyCredit);
    console.info('   Raw Rolling Average:', rollingAverage.toFixed(2));
    console.info('   Combined Sum:', (currentEnergyCredit + rollingAverage).toFixed(2));
    console.info('   Smoothed Score:', result.value, '(sigmoid applied)');
    
    // Calculate different rolling averages for comparison
    console.info('\n🔄 Rolling Average Variations:');
    
    // High historical performance
    const highHistorical = [85, 90, 88, 92, 87, 91, 89];
    const highRollingAvg = calculateWeightedRollingAverage(highHistorical);
    const resultHigh = calculateTotalEnergyCreditScore(currentEnergyCredit, highRollingAvg);
    console.info('   High History Avg:', highRollingAvg.toFixed(2), '→ Score:', resultHigh.value);
    
    // Low historical performance  
    const lowHistorical = [45, 52, 38, 48, 41, 55, 47];
    const lowRollingAvg = calculateWeightedRollingAverage(lowHistorical);
    const resultLow = calculateTotalEnergyCreditScore(currentEnergyCredit, lowRollingAvg);
    console.info('   Low History Avg:', lowRollingAvg.toFixed(2), '→ Score:', resultLow.value);
    
    // Volatile historical performance
    const volatileHistorical = [25, 85, 35, 90, 30, 95, 40];
    const volatileRollingAvg = calculateWeightedRollingAverage(volatileHistorical);
    const resultVolatile = calculateTotalEnergyCreditScore(currentEnergyCredit, volatileRollingAvg);
    console.info('   Volatile History Avg:', volatileRollingAvg.toFixed(2), '→ Score:', resultVolatile.value);
    
    return {
        totalEnergyCreditScore: result,
        dependencies: {
            historicalScores: historicalEnergyScores,
            rollingAverage: rollingAverage,
            currentScore: currentEnergyCredit
        },
        scenarios: {
            high: { input: highCurrentScore, result: result1 },
            low: { input: lowCurrentScore, result: result2 },
            matching: { input: matchingScore, result: result3 }
        },
        rollingAverageComparisons: {
            highHistory: { scores: highHistorical, average: highRollingAvg, result: resultHigh },
            lowHistory: { scores: lowHistorical, average: lowRollingAvg, result: resultLow },
            volatileHistory: { scores: volatileHistorical, average: volatileRollingAvg, result: resultVolatile }
        }
    };
};
// mockTotalEnergyCreditScoreIntegrationTest();