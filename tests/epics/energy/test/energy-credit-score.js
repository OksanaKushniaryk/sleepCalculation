/**
 * Energy Credit Score Calculation
 *
 * Energy Credit Score based on EnergyDelta (EnergyCapacity - TEE).
 * Uses sigmoid function with current score and rolling average.
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateEnergyCreditScore} from "../energy-credit-score.js";
import {calculateEnergyCapacity} from "../energy-capacity.js";
import {calculateBasalMetabolicRate} from "../basal-metabolic-rate.js";
import {calculateTotalEnergyExpenditure} from "../total-energy-expenditure.js";
import {calculateThermicEffectFood} from "../thermic-effect-food.js";
import {calculatePhysicalActivityEnergyExpenditure} from "../physical-activity-energy-expenditure.js";

export const mockEnergyCreditScoreTest = async () => {
    await sleep(2000);

    const result = calculateEnergyCreditScore(2500, 2500, 500, 0);

    console.info('calculate Energy Credit Score =', result);

    return result;
}
mockEnergyCreditScoreTest();

export const mockEnergyCreditScoreIntegrationTest = async () => {
    await sleep(1000);
    
    console.info('🔗 Energy Credit Score Integration Test - Using calculated Energy Capacity and TEE');
    
    // Calculate BMR first
    const bmrResult = calculateBasalMetabolicRate(80, 170, 25, 'female', 85, 35, 16);
    console.info('   Calculated BMR:', bmrResult.value, 'kcal/day');
    
    // Calculate Energy Capacity using BMR
    const energyCapacityResult = calculateEnergyCapacity(bmrResult.value, 85, 90, 30);
    console.info('   Calculated Energy Capacity:', energyCapacityResult.value, 'kcal/day');
    
    // Calculate TEF (Thermic Effect of Food)
    const tefResult = calculateThermicEffectFood(2000, 600, 800, 600);
    console.info('   Calculated TEF:', tefResult.value, 'kcal/day');
    
    // Calculate PAEE (Physical Activity Energy Expenditure)
    const paeeResult = calculatePhysicalActivityEnergyExpenditure(5.5, bmrResult.value, 0.75, 2.0);
    console.info('   Calculated PAEE:', paeeResult.value, 'kcal');
    
    // Calculate Total Energy Expenditure using TEF and PAEE
    const teeResult = calculateTotalEnergyExpenditure(
        tefResult.value, 
        paeeResult.value, 
        100, // stress energy
        85,  // sleep score
        35,  // stress score
        16   // time of day
    );
    console.info('   Calculated TEE:', teeResult.value, 'kcal/day');
    
    // Now calculate Energy Credit Score using calculated Energy Capacity and TEE
    const result = calculateEnergyCreditScore(
        energyCapacityResult.value,  // Using calculated Energy Capacity
        teeResult.value,             // Using calculated TEE
        300,                         // historical average
        0                           // current score
    );
    
    console.info('🎯 Energy Credit Score (Integration):', result.value);
    console.info('   Energy Capacity Input:', energyCapacityResult.value, 'kcal/day');
    console.info('   TEE Input:', teeResult.value, 'kcal/day');
    console.info('   Energy Delta:', result.energyDelta, 'kcal/day');
    console.info('   Score Components:', result.components);
    
    return {
        creditScore: result,
        dependencies: {
            bmr: bmrResult,
            energyCapacity: energyCapacityResult,
            tef: tefResult,
            paee: paeeResult,
            tee: teeResult
        }
    };
}

// mockEnergyCreditScoreIntegrationTest();