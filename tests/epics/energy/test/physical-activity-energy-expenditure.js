/**
 * Physical Activity Energy Expenditure (PAEE) Calculation
 *
 * PAEE varies significantly based on lifestyle and fitness level. It includes both
 * structured exercise and non-exercise activity thermogenesis (NEAT).
 *
 * Formula: PAEE = MET value × AdjustedBMR/hour × duration (hours)
 * Where MET = AdjustedBMR or Input from wearable
 */

import {sleep} from "../../../utils/async-helper.js";

export const mockPhysicalActivityEnergyExpenditureTest = async () => {
    await sleep(2000);

    console.log('\n=== Physical Activity Energy Expenditure (PAEE) Test Suite ===');

    // Test data setup
    const baseBMR = 2000; // Example adjusted BMR in kcal/day
    const results = [];

    // Test 1: Standard MET-based calculation - Light activity (Walking)
    console.log('\n--- Test 1: Standard MET-based - Light Walking (3.0 MET) ---');
    const test1 = calculatePhysicalActivityEnergyExpenditure(3.0, baseBMR, 1.0);
    console.log('Light Walking PAEE =', test1);
    results.push({test: 'Light Walking (3.0 MET, 1h)', result: test1});

    // Test 2: Standard MET-based calculation - Moderate activity (Jogging)
    console.log('\n--- Test 2: Standard MET-based - Moderate Jogging (7.0 MET) ---');
    const test2 = calculatePhysicalActivityEnergyExpenditure(7.0, baseBMR, 0.5);
    console.log('Moderate Jogging PAEE =', test2);
    results.push({test: 'Moderate Jogging (7.0 MET, 0.5h)', result: test2});

    // Test 3: Standard MET-based calculation - Vigorous activity (Running)
    console.log('\n--- Test 3: Standard MET-based - Vigorous Running (12.0 MET) ---');
    const test3 = calculatePhysicalActivityEnergyExpenditure(12.0, baseBMR, 0.75);
    console.log('Vigorous Running PAEE =', test3);
    results.push({test: 'Vigorous Running (12.0 MET, 0.75h)', result: test3});

    // Test 4: Enhanced calculation - Low wearable activity level
    console.log('\n--- Test 4: Enhanced - Low Activity Level with Light Exercise ---');
    const test4 = calculatePhysicalActivityEnergyExpenditure(4.0, baseBMR, 1.5, 1.2);
    console.log('Low Activity Level PAEE =', test4);
    results.push({test: 'Low Activity Level (4.0 MET, 1.5h, AL:1.2)', result: test4});

    // Test 5: Enhanced calculation - Moderate wearable activity level
    console.log('\n--- Test 5: Enhanced - Moderate Activity Level with Moderate Exercise ---');
    const test5 = calculatePhysicalActivityEnergyExpenditure(6.5, baseBMR, 1.0, 2.5);
    console.log('Moderate Activity Level PAEE =', test5);
    results.push({test: 'Moderate Activity Level (6.5 MET, 1h, AL:2.5)', result: test5});

    // Test 6: Enhanced calculation - High wearable activity level
    console.log('\n--- Test 6: Enhanced - High Activity Level with Vigorous Exercise ---');
    const test6 = calculatePhysicalActivityEnergyExpenditure(10.0, baseBMR, 2.0, 4.0);
    console.log('High Activity Level PAEE =', test6);
    results.push({test: 'High Activity Level (10.0 MET, 2h, AL:4.0)', result: test6});

    // Test 7: Edge case - Very low MET value (Sleeping)
    console.log('\n--- Test 7: Edge Case - Very Low MET (Sleeping) ---');
    const test7 = calculatePhysicalActivityEnergyExpenditure(0.95, baseBMR, 8.0);
    console.log('Sleeping PAEE =', test7);
    results.push({test: 'Sleeping (0.95 MET, 8h)', result: test7});

    // Test 8: Edge case - Very high MET value (Competitive sports)
    console.log('\n--- Test 8: Edge Case - Very High MET (Competitive Sports) ---');
    const test8 = calculatePhysicalActivityEnergyExpenditure(18.0, baseBMR, 0.25);
    console.log('Competitive Sports PAEE =', test8);
    results.push({test: 'Competitive Sports (18.0 MET, 0.25h)', result: test8});

    // Test 9: Edge case - Zero activity level (should use standard calculation)
    console.log('\n--- Test 9: Edge Case - Zero Activity Level ---');
    const test9 = calculatePhysicalActivityEnergyExpenditure(5.0, baseBMR, 1.0, 0);
    console.log('Zero Activity Level PAEE =', test9);
    results.push({test: 'Zero Activity Level (5.0 MET, 1h, AL:0)', result: test9});

    // Test 10: Edge case - Null activity level (should use standard calculation)
    console.log('\n--- Test 10: Edge Case - Null Activity Level ---');
    const test10 = calculatePhysicalActivityEnergyExpenditure(5.0, baseBMR, 1.0, null);
    console.log('Null Activity Level PAEE =', test10);
    results.push({test: 'Null Activity Level (5.0 MET, 1h, AL:null)', result: test10});

    // Test 11: Different BMR values - Low BMR
    console.log('\n--- Test 11: Different BMR - Low BMR (1400 kcal/day) ---');
    const test11 = calculatePhysicalActivityEnergyExpenditure(6.0, 1400, 1.0);
    console.log('Low BMR PAEE =', test11);
    results.push({test: 'Low BMR (6.0 MET, 1h, BMR:1400)', result: test11});

    // Test 12: Different BMR values - High BMR
    console.log('\n--- Test 12: Different BMR - High BMR (2800 kcal/day) ---');
    const test12 = calculatePhysicalActivityEnergyExpenditure(6.0, 2800, 1.0);
    console.log('High BMR PAEE =', test12);
    results.push({test: 'High BMR (6.0 MET, 1h, BMR:2800)', result: test12});

    // Test 13: Long duration activity
    console.log('\n--- Test 13: Long Duration - All Day Activity ---');
    const test13 = calculatePhysicalActivityEnergyExpenditure(1.8, baseBMR, 16.0);
    console.log('All Day Activity PAEE =', test13);
    results.push({test: 'All Day Activity (1.8 MET, 16h)', result: test13});

    // Test 14: Short duration high intensity
    console.log('\n--- Test 14: Short Duration High Intensity ---');
    const test14 = calculatePhysicalActivityEnergyExpenditure(15.0, baseBMR, 0.1);
    console.log('Short High Intensity PAEE =', test14);
    results.push({test: 'Short High Intensity (15.0 MET, 0.1h)', result: test14});

    // Summary
    console.log('\n=== Test Summary ===');
    results.forEach((test, index) => {
        console.log(`${index + 1}. ${test.test}: ${test.result.value} kcal (${test.result.calculationMethod})`);
    });

    console.log('\n=== Calculation Method Breakdown ===');
    const standardTests = results.filter(r => r.result.calculationMethod === 'standard_met_based');
    const enhancedTests = results.filter(r => r.result.calculationMethod === 'enhanced_wearable_and_met');

    console.log(`Standard MET-based calculations: ${standardTests.length}`);
    console.log(`Enhanced wearable+MET calculations: ${enhancedTests.length}`);

    console.log('\n=== BMR per Hour Validation ===');
    console.log(`Base BMR: ${baseBMR} kcal/day`);
    console.log(`BMR per hour: ${baseBMR / 24} kcal/hour`);
    console.log(`Test 1 BMR per hour: ${test1.bmrPerHour} kcal/hour`);

    return {
        totalTests: results.length,
        results,
        summary: {
            standardCalculations: standardTests.length,
            enhancedCalculations: enhancedTests.length,
            baseBMRUsed: baseBMR
        }
    };
}

mockPhysicalActivityEnergyExpenditureTest();
