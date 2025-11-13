/**
 * Physical Activity Energy Expenditure (PAEE) Calculation
 *
 * PAEE includes structured exercise and non-exercise activity thermogenesis (NEAT).
 * Formula: PAEE = MET value × AdjustedBMR/hour × duration (hours)
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculatePhysicalActivityEnergyExpenditure} from "../physical-activity-energy-expenditure.js";
import {calculateBasalMetabolicRate} from "../basal-metabolic-rate.js";

export const mockPhysicalActivityEnergyExpenditureTest = async () => {
    await sleep(2000);

    const result = calculatePhysicalActivityEnergyExpenditure(6.5, 2000, 1.0, 2.5);

    console.info('calculate Physical Activity Energy Expenditure =', result);

    return result;
}
mockPhysicalActivityEnergyExpenditureTest();

export const mockPhysicalActivityEnergyExpenditureIntegrationTest = async () => {
    await sleep(1000);
    
    console.info('🔗 PAEE Integration Test - Using calculated BMR');
    
    // Calculate BMR first
    const bmrResult = calculateBasalMetabolicRate(88, 180, 35, 'male', 82, 38, 10);
    console.info('   Calculated BMR:', bmrResult.value, 'kcal/day');
    
    // Now calculate PAEE using the calculated BMR instead of hardcoded value
    const result = calculatePhysicalActivityEnergyExpenditure(
        7.0,              // MET value (jogging)
        bmrResult.value,  // Using calculated BMR instead of hardcoded 2000
        1.5,              // duration (1.5 hours)
        3.0               // intensity factor (high intensity)
    );
    
    console.info('🎯 PAEE (Integration):', result.value, 'kcal');
    console.info('   BMR Input:', bmrResult.value, 'kcal/day');
    console.info('   BMR/hour:', bmrResult.value / 24, 'kcal/hour');
    console.info('   Activity Details:', result.activityDetails);
    console.info('   MET Value:', result.metValue);
    console.info('   Duration:', result.duration, 'hours');
    
    return {
        paee: result,
        dependencies: {
            bmr: bmrResult
        }
    };
};
// mockPhysicalActivityEnergyExpenditureIntegrationTest();
