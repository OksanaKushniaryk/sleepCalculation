/**
 * Energy Capacity Calculation
 *
 * EnergyCapacity = BMR × CapacityMultiplier
 * CapacityMultiplier = 1.5 + α × FitnessScore + β × RecoveryScore - γ × StressIndex
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateEnergyCapacity} from "../energy-capacity.js";
import {calculateBasalMetabolicRate} from "../basal-metabolic-rate.js";
import {calculateRecoveryScore} from "../recovery-score.js";
import {calculateHRVScore} from "../hrv-score.js";

export const mockEnergyCapacityTest = async () => {
    await sleep(2000);

    const result = calculateEnergyCapacity(1800, 80, 85, 25);

    console.info('calculate Energy Capacity =', result);

    return result;
}
mockEnergyCapacityTest();

export const mockEnergyCapacityIntegrationTest = async () => {
    await sleep(1000);
    
    console.info('🔗 Energy Capacity Integration Test - Using calculated BMR and Recovery Score');
    
    // Calculate BMR first
    const bmrResult = calculateBasalMetabolicRate(85, 175, 28, 'male', 80, 45, 15);
    console.info('   Calculated BMR:', bmrResult.value, 'kcal/day');
    
    // Calculate HRV Score for Recovery
    const hrvResult = calculateHRVScore(30, 35, 12, 'general');
    console.info('   Calculated HRV Score:', hrvResult.score);
    
    // Calculate Recovery Score using HRV and sleep
    const recoveryResult = calculateRecoveryScore(hrvResult.score, 80);
    console.info('   Calculated Recovery Score:', recoveryResult.value);
    
    // Now calculate Energy Capacity using these calculated values
    const result = calculateEnergyCapacity(
        bmrResult.value,          // Using calculated BMR instead of hardcoded 1800
        75,                       // fitness score
        recoveryResult.value,     // Using calculated recovery score
        45                        // stress index
    );
    
    console.info('🎯 Energy Capacity (Integration):', result.value, 'kcal/day');
    console.info('   BMR Input:', bmrResult.value);
    console.info('   Recovery Input:', recoveryResult.value);
    console.info('   Capacity Multiplier:', result.capacityMultiplier);
    
    return {
        energyCapacity: result,
        dependencies: {
            bmr: bmrResult,
            hrv: hrvResult,
            recovery: recoveryResult
        }
    };
}
// mockEnergyCapacityIntegrationTest();