/**
 * Total Energy Expenditure (TEE) Integration Test
 *
 * TEE represents the total amount of energy a person uses in a day. It is a sum of:
 * - TEF (Thermic Effect of Food): Energy used for digesting, absorbing, and metabolizing food
 * - PAEE (Physical Activity Energy Expenditure): Energy expended through physical activity
 * - Stress energy: Additional energy cost from stress response
 *
 * This integration test calculates each component separately using their respective modules,
 * then combines them into the total TEE calculation.
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateTotalEnergyExpenditure} from "../total-energy-expenditure.js";
import {calculateBasalMetabolicRate} from "../basal-metabolic-rate.js";
import {calculateThermicEffectFood} from "../thermic-effect-food.js";
import {calculatePhysicalActivityEnergyExpenditure} from "../physical-activity-energy-expenditure.js";
import {calculateStressScore} from "../../stress/stress-score.js";

export const mockTotalEnergyExpenditureTest = async () => {
    await sleep(2000);
    
    console.log('\n=== Total Energy Expenditure (TEE) Integration Test ===\n');
    
    // Step 1: Calculate BMR (needed for PAEE calculation)
    console.log('--- Step 1: Calculate BMR ---');
    const bmrResult = calculateBasalMetabolicRate(75, 175, 30, 'male', 80, 40, 14);
    console.log('BMR Result:', bmrResult.value, 'kcal/day');
    
    // Step 2: Calculate TEF (Thermic Effect of Food)
    console.log('\n--- Step 2: Calculate TEF ---');
    const tefResult = calculateThermicEffectFood(2200, 550, 1100, 550); // Balanced diet
    console.log('TEF Result:', tefResult.value, 'kcal/day');
    console.log('TEF Method:', tefResult.calculationMethod);
    
    // Step 3: Calculate PAEE (Physical Activity Energy Expenditure)
    console.log('\n--- Step 3: Calculate PAEE ---');
    const paeeResult = calculatePhysicalActivityEnergyExpenditure(6.5, bmrResult.value, 1.5, 2.0);
    console.log('PAEE Result:', paeeResult.value, 'kcal/day');
    console.log('PAEE Method:', paeeResult.calculationMethod);
    
    // Step 4: Calculate Stress Energy
    console.log('\n--- Step 4: Calculate Stress Energy ---');
    const stressResult = calculateStressScore(72, 150); // RHR 72, steps in last 30min
    const stressEnergy = Math.round((stressResult.value / 100) * 200); // Stress contributes 0-200 kcal based on score
    console.log('Stress Score:', stressResult.value);
    console.log('Stress Energy:', stressEnergy, 'kcal/day');
    
    // Step 5: Calculate Total TEE using integrated components
    console.log('\n--- Step 5: Calculate Total TEE (Integration) ---');
    const integratedTEE = calculateTotalEnergyExpenditure(
        tefResult.value,
        paeeResult.value,
        stressEnergy,
        80, // sleep score
        stressResult.value, // stress score from calculation
        14  // time of day
    );
    
    console.log('\n=== Integration Results ===');
    console.log('TEF (Thermic Effect of Food):', tefResult.value, 'kcal/day');
    console.log('PAEE (Physical Activity):', paeeResult.value, 'kcal/day');
    console.log('Stress Energy:', stressEnergy, 'kcal/day');
    console.log('Base TEE (sum of components):', integratedTEE.baseTEE, 'kcal/day');
    console.log('Adjusted TEE (with factors):', integratedTEE.value, 'kcal/day');
    
    console.log('\n=== Adjustment Factors ===');
    console.log('Sleep Efficiency Factor:', integratedTEE.adjustmentFactors.sleepEfficiency);
    console.log('Stress Impact Factor:', integratedTEE.adjustmentFactors.stressImpact);
    console.log('Time Activity Factor:', integratedTEE.adjustmentFactors.timeActivity);
    
    // Step 6: Compare with simplified calculation
    console.log('\n--- Step 6: Comparison Tests ---');
    const simplifiedTEE = calculateTotalEnergyExpenditure(250, 400, 150, 75, 60, 14);
    console.log('Simplified TEE (manual values):', simplifiedTEE.value, 'kcal/day');
    console.log('Integrated TEE (calculated components):', integratedTEE.value, 'kcal/day');
    console.log('Difference:', Math.abs(simplifiedTEE.value - integratedTEE.value), 'kcal/day');
    
    // Step 7: Validation summary
    console.log('\n=== Validation Summary ===');
    const totalComponentsSum = tefResult.value + paeeResult.value + stressEnergy;
    const calculatedSum = integratedTEE.baseTEE;
    console.log('Manual sum of components:', totalComponentsSum.toFixed(2), 'kcal/day');
    console.log('TEE base calculation:', calculatedSum, 'kcal/day');
    console.log('Components match:', Math.abs(totalComponentsSum - calculatedSum) < 0.01 ? '✅' : '❌');
    
    console.log('\n=== Final TEE Result ===');
    console.log('Total Energy Expenditure:', integratedTEE.value, 'kcal/day');
    console.log('Integration test completed successfully!');
    
    return {
        integratedTEE,
        components: {
            bmr: bmrResult,
            tef: tefResult,
            paee: paeeResult,
            stress: {score: stressResult.value, energy: stressEnergy}
        },
        simplifiedTEE,
        validation: {
            componentsMatch: Math.abs(totalComponentsSum - calculatedSum) < 0.01,
            totalComponentsSum: totalComponentsSum,
            calculatedSum: calculatedSum
        }
    };
};

mockTotalEnergyExpenditureTest();