/**
 * Total Energy Expenditure (TEE) Calculation
 *
 * TEE represents the total amount of energy a person uses in a day.
 * Sum of TEF (Thermic Effect of Food) + PAEE (Physical Activity) + Stress energy.
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateTotalEnergyExpenditure} from "../total-energy-expenditure.js";
import {calculateThermicEffectFood} from "../thermic-effect-food.js";
import {calculatePhysicalActivityEnergyExpenditure} from "../physical-activity-energy-expenditure.js";
import {calculateBasalMetabolicRate} from "../basal-metabolic-rate.js";

export const mockTotalEnergyExpenditureTest = async () => {
    await sleep(2000);

    const result = calculateTotalEnergyExpenditure(250, 400, 150, 80, 60, 14);

    console.info('calculate Total Energy Expenditure =', result);

    return result;
};
mockTotalEnergyExpenditureTest();

export const mockTotalEnergyExpenditureIntegrationTest = async () => {
    await sleep(1000);
    
    console.info('🔗 Total Energy Expenditure Integration Test - Using calculated TEF and PAEE');
    
    // Calculate BMR first (needed for PAEE)
    const bmrResult = calculateBasalMetabolicRate(75, 165, 32, 'female', 75, 55, 18);
    console.info('   Calculated BMR:', bmrResult.value, 'kcal/day');
    
    // Calculate TEF (Thermic Effect of Food)
    const tefResult = calculateThermicEffectFood(
        2100,  // total calories
        630,   // protein calories (30%)
        840,   // carb calories (40%) 
        630    // fat calories (30%)
    );
    console.info('   Calculated TEF:', tefResult.value, 'kcal/day');
    
    // Calculate PAEE (Physical Activity Energy Expenditure) using calculated BMR
    const paeeResult = calculatePhysicalActivityEnergyExpenditure(
        4.5,           // MET value (moderate walking)
        bmrResult.value, // Using calculated BMR
        1.25,          // duration in hours
        1.8            // intensity factor
    );
    console.info('   Calculated PAEE:', paeeResult.value, 'kcal');
    
    // Calculate stress energy based on stress score
    const stressEnergy = 120; // Additional stress-related expenditure
    
    // Now calculate Total Energy Expenditure using calculated components
    const result = calculateTotalEnergyExpenditure(
        tefResult.value,   // Using calculated TEF
        paeeResult.value,  // Using calculated PAEE
        stressEnergy,      // stress energy
        75,                // sleep score
        55,                // stress score  
        18                 // time of day
    );
    
    console.info('🎯 Total Energy Expenditure (Integration):', result.value, 'kcal/day');
    console.info('   TEF Input:', tefResult.value, 'kcal/day');
    console.info('   PAEE Input:', paeeResult.value, 'kcal');
    console.info('   Stress Energy:', stressEnergy, 'kcal');
    console.info('   Base TEE:', result.baseTEE, 'kcal/day');
    console.info('   Adjustment Factors:', result.adjustmentFactors);
    
    return {
        tee: result,
        dependencies: {
            bmr: bmrResult,
            tef: tefResult,
            paee: paeeResult,
            stressEnergy
        }
    };
};

// mockTotalEnergyExpenditureIntegrationTest();