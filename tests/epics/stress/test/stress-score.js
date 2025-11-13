/**
 * Stress Score Calculation
 *
 * Stress score is primarily based on Resting Heart Rate (RHR) with parasympathetic scoring.
 * Lower RHR indicates more parasympathetic (less stress), higher RHR indicates more sympathetic (more stress).
 *
 * Formula from OneVital specification:
 * RHR_Para(x) = if x >= μ_rhr: 0
 *               else: 100 * (1 - exp(- ((μ_rhr - x)^2) / (2 * σ_rhr^2)))
 *
 * where: x = resting heart rate (bpm), μ_rhr = 100 bpm, σ_rhr = 15 bpm
 * Overall_Stress = RHR_Para (inverted - high parasympathetic = low stress)
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateStressScore} from "../stress-score.js";

export const mockStressScoreTest = async () => {
    await sleep(2000);
    /// real test
    const result = calculateStressScore(70);
    // const result = calculateStressScore([120, 85, 60, 53, 14, 134, 120, 85, 60, 53, 14, 134, 120, 85, 60, 53, 14, 134, 120, 85, 60, 53, 14, 134]);

    console.info('calculate Stress Score =', result);

    return result;
}
mockStressScoreTest();

export const mockStressScoreIntegrationTest = async () => {
    await sleep(1000);

    console.info('🔗 Stress Score Integration Test - Using calculated RHR and Parasympathetic Score');

    // Test scenario 1: Heart rate array data (requires RHR calculation)
    console.info('\n📊 Scenario 1: Calculating from heart rate array');
    const heartRateReadings = [82, 78, 85, 79, 81, 77, 83, 80, 76, 84, 78, 82];
    const totalStepsLast30Min = 280; // Low activity (under 300 steps threshold)

    const result1 = calculateStressScore(heartRateReadings, totalStepsLast30Min, 100, 15, 75);

    console.info('   Heart Rate Readings:', heartRateReadings.slice(0, 5), '... (', heartRateReadings.length, 'total)');
    console.info('   Steps in 30min:', totalStepsLast30Min);
    console.info('   Calculated RHR:', result1.components.rhr.value, 'bpm');
    console.info('   RHR Method:', result1.components.rhr.calculationMethod);
    console.info('   Parasympathetic Score:', result1.components.parasympathetic.value);
    console.info('🎯 Stress Score (from HR array):', result1.value);

    // Test scenario 2: Pre-calculated RHR (simpler case)
    console.info('\n📊 Scenario 2: Using pre-calculated RHR');
    const preCalculatedRHR = 72;
    const result2 = calculateStressScore(preCalculatedRHR, 0, 100, 15, 75);

    console.info('   Pre-calculated RHR:', preCalculatedRHR, 'bpm');
    console.info('   Parasympathetic Score:', result2.components.parasympathetic.value);
    console.info('🎯 Stress Score (from RHR):', result2.value);

    // Test scenario 3: High stress scenario (higher RHR)
    console.info('\n📊 Scenario 3: High stress scenario');
    const highStressHR = [95, 98, 92, 96, 94, 99, 93, 97, 91, 95, 98, 94];
    const highActivitySteps = 520; // High activity

    const result3 = calculateStressScore(highStressHR, highActivitySteps, 100, 15, 85);

    console.info('   High Stress HR:', highStressHR.slice(0, 5), '... (avg:', Math.round(highStressHR.reduce((a, b) => a + b) / highStressHR.length), 'bpm)');
    console.info('   Steps in 30min:', highActivitySteps);
    console.info('   Calculated RHR:', result3.components.rhr.value, 'bpm');
    console.info('   Parasympathetic Score:', result3.components.parasympathetic.value);
    console.info('🎯 Stress Score (high stress):', result3.value);

    // Test scenario 4: Rest period scenario (very low activity)
    console.info('\n📊 Scenario 4: At rest scenario');
    const restingHR = [62, 65, 60, 63, 61, 64, 59, 66, 62, 60, 63, 61];
    const restingSteps = 50; // Very low activity

    const result4 = calculateStressScore(restingHR, restingSteps, 100, 15, 65);

    console.info('   Resting HR:', restingHR.slice(0, 5), '... (avg:', Math.round(restingHR.reduce((a, b) => a + b) / restingHR.length), 'bpm)');
    console.info('   Steps in 30min:', restingSteps, '(under 300 threshold)');
    console.info('   Calculated RHR:', result4.components.rhr.value, 'bpm');
    console.info('   Parasympathetic Score:', result4.components.parasympathetic.value);
    console.info('🎯 Stress Score (at rest):', result4.value);

    // Compare all scenarios
    console.info('\n📈 Scenario Comparison:');
    console.info('   Moderate Activity:', result1.value.toFixed(1), '(RHR:', result1.components.rhr.value, 'bpm)');
    console.info('   Pre-calculated:', result2.value.toFixed(1), '(RHR:', result2.components.rhr.value, 'bpm)');
    console.info('   High Stress:', result3.value.toFixed(1), '(RHR:', result3.components.rhr.value, 'bpm)');
    console.info('   At Rest:', result4.value.toFixed(1), '(RHR:', result4.components.rhr.value, 'bpm)');

    return {
        stressScores: {
            moderateActivity: result1,
            preCalculated: result2,
            highStress: result3,
            atRest: result4
        },
        dependencies: {
            heartRateData: {
                moderate: heartRateReadings,
                highStress: highStressHR,
                rest: restingHR
            },
            activityLevels: {
                moderate: totalStepsLast30Min,
                highStress: highActivitySteps,
                rest: restingSteps
            }
        },
        comparison: {
            lowest: Math.min(result1.value, result2.value, result3.value, result4.value),
            highest: Math.max(result1.value, result2.value, result3.value, result4.value)
        }
    };
};
// mockStressScoreIntegrationTest();