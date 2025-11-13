/**
 * Energy Safe Zone Calculation
 *
 * Energy Safe Zone represents a recommended range of energy balance based on historical data.
 * Formula: EnergySafeZone = +/- average(EnergyDelta in last week) +/- 50
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateEnergySafeZone} from "../energy-safe-zone.js";
import {calculateEnergyCapacity} from "../energy-capacity.js";
import {calculateTotalEnergyExpenditure} from "../total-energy-expenditure.js";
import {calculateBasalMetabolicRate} from "../basal-metabolic-rate.js";

export const mockEnergySafeZoneTest = async () => {
    await sleep(2000);

    const historicalData = [100, 150, 75, 200, 125, 175, 90];
    const result = calculateEnergySafeZone(historicalData);

    console.info('calculate Energy Safe Zone =', result);

    return result;
}
mockEnergySafeZoneTest();

export const mockEnergySafeZoneIntegrationTest = async () => {
    await sleep(1000);

    console.info('🔗 Energy Safe Zone Integration Test - Using calculated Energy Deltas');

    // Calculate historical energy deltas for the past week
    const weeklyData = [];

    // Simulate 7 days of energy calculations
    for (let day = 1; day <= 7; day++) {
        console.info(`   Calculating Day ${day} energy delta...`);

        // Vary parameters slightly for each day to simulate real data
        const bmr = calculateBasalMetabolicRate(
            78 + (day * 0.5), // slight weight variation
            172,
            29,
            'female',
            75 + (day * 2),  // varying sleep scores
            40 + (day * 3),  // varying stress
            12 + day         // different times of day
        );

        const energyCapacity = calculateEnergyCapacity(
            bmr.value,
            80 - (day * 2), // varying fitness
            85 + day,       // varying recovery
            35 + (day * 2)  // varying stress
        );

        const tee = calculateTotalEnergyExpenditure(
            200 + (day * 10), // varying TEF
            350 + (day * 20), // varying PAEE
            80 + (day * 5),   // varying stress energy
            75 + (day * 2),   // sleep score
            40 + (day * 3),   // stress score
            12 + day          // time of day
        );

        // Calculate energy delta for this day
        const energyDelta = energyCapacity.value - tee.value;
        weeklyData.push(energyDelta);

        console.info(`     Day ${day}: Capacity=${energyCapacity.value.toFixed(1)}, TEE=${tee.value.toFixed(1)}, Delta=${energyDelta.toFixed(1)}`);
    }

    console.info('   Weekly Energy Deltas:', weeklyData.map(d => d.toFixed(1)));

    // Now calculate Energy Safe Zone using calculated energy deltas
    const result = calculateEnergySafeZone(weeklyData);

    console.info('🎯 Energy Safe Zone (Integration):', result);
    console.info('   Average Delta:', result.averageDelta, 'kcal/day');
    console.info('   Safe Zone Range:', `${result.lowerBound} to ${result.upperBound} kcal/day`);
    console.info('   Zone Width:', result.upperBound - result.lowerBound, 'kcal/day');

    // Calculate some statistics
    const minDelta = Math.min(...weeklyData);
    const maxDelta = Math.max(...weeklyData);
    const deltaRange = maxDelta - minDelta;

    console.info('   Historical Stats:');
    console.info(`     Min Delta: ${minDelta.toFixed(1)} kcal/day`);
    console.info(`     Max Delta: ${maxDelta.toFixed(1)} kcal/day`);
    console.info(`     Range: ${deltaRange.toFixed(1)} kcal/day`);

    return {
        safeZone: result,
        dependencies: {
            weeklyDeltas: weeklyData,
            statistics: {
                min: minDelta,
                max: maxDelta,
                range: deltaRange,
                average: result.averageDelta
            }
        }
    };
};
// mockEnergySafeZoneIntegrationTest();