/**
 * Energy Credit Score Calculation
 *
 * Energy Credit Score is calculated in two parts:
 * 1. Daily Update: ΔCreditScore based on EnergyDelta (EnergyCapacity - TEE)
 * 2. Total Energy Credit Score: Using sigmoid function with current score and rolling average
 *
 * Formulas:
 * - EnergyDelta = EnergyCapacity - TEE
 * - scaled_EnergyDelta = EnergyDelta / MaxScalingDelta
 * - If EnergyDelta > 0: ΔCreditScore = +S × tanh(scaled_EnergyDelta)
 * - If EnergyDelta < 0: ΔCreditScore = -D × tanh(|scaled_EnergyDelta|)
 * - TotalEnergyCreditScore = MaxCreditScore × sigmoid(CurrentScore + RollingAVG of ΔCreditScores)
 */
import {sleep} from "../../../utils/async-helper.js";
import {
    calculateDailyEnergyCreditUpdate,
    calculateEnergyCreditScore,
    calculateTotalEnergyCreditScore
} from "../energy-credit-score.js";

export const mockEnergyCreditScoreTest = async () => {
    await sleep(2000);

    // Test case 1: Perfect energy balance
    const result1 = calculateEnergyCreditScore(2500, 2500, 500, 0);
    console.info('Energy Credit Score Test 1 (Perfect Balance) =', result1);

    // Test case 2: Energy surplus
    const result2 = calculateEnergyCreditScore(2750, 2500, 500, 1.5);
    console.info('Energy Credit Score Test 2 (Energy Surplus) =', result2);

    // Test case 3: Energy deficit
    const result3 = calculateEnergyCreditScore(2250, 2500, 500, -1.2);
    console.info('Energy Credit Score Test 3 (Energy Deficit) =', result3);

    // Test case 4: Large surplus with high current score
    const result4 = calculateEnergyCreditScore(3000, 2500, 800, 3.0);
    console.info('Energy Credit Score Test 4 (Large Surplus) =', result4);

    // Test case 5: Large deficit with low current score
    const result5 = calculateEnergyCreditScore(2000, 2500, 200, -2.5);
    console.info('Energy Credit Score Test 5 (Large Deficit) =', result5);

    // Test case 6: Daily update only
    const dailyUpdate1 = calculateDailyEnergyCreditUpdate(6277, 2500);
    console.info('Daily Credit Update Test 1 =', dailyUpdate1);

    // Test case 7: Total score calculation
    const totalScore1 = calculateTotalEnergyCreditScore(500, 2.0);
    console.info('Total Credit Score Test 1 =', totalScore1);

    // Test case 8: Edge case - zero energy capacity
    const result8 = calculateEnergyCreditScore(0, 2000, 500, 0);
    console.info('Energy Credit Score Test 8 (Zero Capacity) =', result8);

    // Test case 9: Edge case - extreme surplus
    const result9 = calculateEnergyCreditScore(5000, 2000, 300, 1.0);
    console.info('Energy Credit Score Test 9 (Extreme Surplus) =', result9);

    return {result1, result2, result3, result4, result5, dailyUpdate1, totalScore1, result8, result9};
}
mockEnergyCreditScoreTest();