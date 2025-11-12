/**
 * Energy Capacity Calculation
 *
 * EnergyCapacity = BMR × CapacityMultiplier
 *
 * CapacityMultiplier = 1.5 + α × FitnessScore + β × RecoveryScore - γ × StressIndex
 * CapacityMultiplier = min(max(CapacityMultiplier, 1.0), 5.0)
 *
 * Typical coefficient values: α = 2.0, β = 1.5, γ = 2.0
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateBasalMetabolicRate} from "./basal-metabolic-rate.js";
import {calculateEnergyCapacity} from "../energy-capacity.js";


export const mockEnergyCapacityTest = async () => {
    await sleep(2000);

    // Basic test case: healthy male
    const basalMetabolicRate = calculateBasalMetabolicRate(90, 185, 30, 'male', 75, 50, 12);
    const result1 = calculateEnergyCapacity(basalMetabolicRate.value, 80, 85, 25);
    console.info('Energy Capacity Test 1 (Healthy Male) =', result1);

    // Test case 2: Female with VO2 data
    const bmr2 = calculateBasalMetabolicRate(65, 165, 25, 'female', 80, 40, 14);
    const vo2Data = {current: 40, target: getTargetVO2Max(25, 'female'), sigma: 3.0};
    const result2 = calculateEnergyCapacity(bmr2.value, null, 75, 35, vo2Data);
    console.info('Energy Capacity Test 2 (Female with VO2) =', result2);

    // Test case 3: Male with body fat data
    const bmr3 = calculateBasalMetabolicRate(80, 175, 35, 'male', 70, 60, 16);
    const bodyFatData = {percentage: 15, ...getOptimalBodyFatRange(35, 'male', 'fitness')};
    const result3 = calculateEnergyCapacity(bmr3.value, null, 80, 20, null, bodyFatData);
    console.info('Energy Capacity Test 3 (Male with Body Fat) =', result3);

    // Test case 4: Edge case - minimum multiplier
    const result4 = calculateEnergyCapacity(1800, 0, 0, 100);
    console.info('Energy Capacity Test 4 (Minimum Multiplier) =', result4);

    // Test case 5: Edge case - maximum multiplier
    const result5 = calculateEnergyCapacity(1800, 100, 100, 0);
    console.info('Energy Capacity Test 5 (Maximum Multiplier) =', result5);

    // Test case 6: Senior athlete
    const bmr6 = calculateBasalMetabolicRate(70, 170, 60, 'male', 85, 30, 8);
    const vo2Data6 = {current: 38, target: getTargetVO2Max(60, 'male'), sigma: 3.0};
    const result6 = calculateEnergyCapacity(bmr6.value, null, 90, 15, vo2Data6);
    console.info('Energy Capacity Test 6 (Senior Athlete) =', result6);

    return {result1, result2, result3, result4, result5, result6};
}
mockEnergyCapacityTest();