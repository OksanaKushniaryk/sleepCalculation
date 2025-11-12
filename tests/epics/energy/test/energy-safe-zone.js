/**
 * Energy Safe Zone Calculation
 *
 * Energy Safe Zone represents a recommended range of energy balance based on historical data.
 * It provides users with a personalized target range for sustainable energy management.
 *
 * Formula: EnergySafeZone = +/- average(EnergyDelta in last week) +/- 50
 *
 * The safe zone is calculated based on previous 7 records (weekly average).
 * If the user doesn't have any records (first day), no safe zone is displayed.
 * Safe zones can be calculated for each day independently (Monday, Tuesday, etc.).
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateEnergySafeZone} from "../energy-safe-zone.js";

export const mockEnergySafeZoneTest = async () => {
    await sleep(2000);

    // Test case 1: Standard 7-day historical data
    const historicalData1 = [100, 150, 75, 200, 125, 175, 90];
    const result1 = calculateEnergySafeZone(historicalData1);
    console.info('Energy Safe Zone Test 1 (7-day history) =', result1);

    // Test case 2: First day user - no historical data
    const result2 = calculateEnergySafeZone([]);
    console.info('Energy Safe Zone Test 2 (No history) =', result2);

    // Test case 3: Insufficient data
    const result3 = calculateEnergySafeZone([100, 150]);
    console.info('Energy Safe Zone Test 3 (Insufficient data) =', result3);

    // Test case 4: Energy deficit pattern
    const historicalData4 = [-100, -150, -75, -200, -125, -175, -90];
    const result4 = calculateEnergySafeZone(historicalData4);
    console.info('Energy Safe Zone Test 4 (Deficit pattern) =', result4);

    // Test case 5: Mixed positive/negative deltas
    const historicalData5 = [100, -150, 75, -200, 125, -175, 90];
    const result5 = calculateEnergySafeZone(historicalData5);
    console.info('Energy Safe Zone Test 5 (Mixed pattern) =', result5);

    // Test case 6: Perfect balance (all zeros)
    const historicalData6 = [0, 0, 0, 0, 0, 0, 0];
    const result6 = calculateEnergySafeZone(historicalData6);
    console.info('Energy Safe Zone Test 6 (Perfect balance) =', result6);

    // Test case 7: Custom buffer zone
    const result7 = calculateEnergySafeZone(historicalData1, 100);
    console.info('Energy Safe Zone Test 7 (Custom buffer) =', result7);

    // Test case 8: Invalid data mixed with valid
    const historicalData8 = [100, null, 150, undefined, 75, NaN, 200, 125];
    const result8 = calculateEnergySafeZone(historicalData8);
    console.info('Energy Safe Zone Test 8 (Invalid data mixed) =', result8);

    // Test case 9: Large energy deltas
    const historicalData9 = [1000, 1500, 750, 2000, 1250, 1750, 900];
    const result9 = calculateEnergySafeZone(historicalData9);
    console.info('Energy Safe Zone Test 9 (Large deltas) =', result9);

    // Test case 10: More than 7 days of data
    const historicalData10 = [100, 150, 75, 200, 125, 175, 90, 110, 140, 85];
    const result10 = calculateEnergySafeZone(historicalData10);
    console.info('Energy Safe Zone Test 10 (10 days) =', result10);

    return {result1, result2, result3, result4, result5, result6, result7, result8, result9, result10};
}
mockEnergySafeZoneTest();