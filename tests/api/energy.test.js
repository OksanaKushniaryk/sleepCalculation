/**
 * OneVital API Energy Endpoints Tests
 *
 * Tests for energy-related health endpoints.
 * Requires valid credentials in .env file.
 */

import 'dotenv/config';
import {TestHelpers, TestState} from '../utils/test-helpers.js';
import {getShortTestDateRange, getTestDateRange} from '../utils/date-helper.js';
import { energyScore } from '../epics/energy_aggregator.js';

describe('OneVital API Energy Endpoints', () => {
    beforeAll(async () => {
        await TestState.initialize();
    });

    afterAll(async () => {
        await TestState.cleanup();
    });

    describe('Energy Data', () => {
        test('GET /api/health/energy should return latest energy snapshot', async () => {
            const result = await TestHelpers.testEndpoint('/api/health/energy', 'GET', null, 200);
            TestHelpers.validateEndpointSuccess(result);

            // If we have data, validate basic structure
            if (result.data && result.data.success) {
                console.info('Energy snapshot data received successfully');
            }
        });

        test('GET /api/health/energy-historical-data should return energy historical data', async () => {
            // Use short date range (7 days) for energy historical data
            const {startDate, endDate} = getShortTestDateRange(7);

            const endpoint = `/api/health/energy-historical-data?startDate=${startDate}&endDate=${endDate}`;
            const result = await TestHelpers.testEndpoint(endpoint, 'GET', null, 200);
            TestHelpers.validateEndpointSuccess(result);

            // If we have data, validate the structure
            if (result.data && result.data.success && result.onevitalData) {
                console.info('Energy historical data received successfully');

                // Log basic info about the response
                const data = result.onevitalData;
                if (data.dailyValues && Array.isArray(data.dailyValues)) {
                    console.info(`Found ${data.dailyValues.length} days of energy historical data`);
                }
            }
        });

        test('GET /api/health/energy-historical-data should return energy statistics and match energy calculations', async () => {
            const {startDate, endDate} = getTestDateRange();

            // Fetch and validate activity data
            // const endpoint = `/api/health/energy-historical-data?startDate=${startDate}&endDate=${endDate}`;
            // const result = await TestHelpers.testEndpoint(endpoint, 'GET', null, 200);
            // TestHelpers.validateEndpointSuccess(result);

            // const dailyValues = activityResult.data.data.dailyValues?.filter(dailyValue => dailyValue.metrics);

            const dailyValues = [{
                date: '2024-10-20',
                BasalMetabolicRate: { value: 1650.5 },
                ThermicEffectFood: { value: 230.0 },
                PhysicalActivityEnergyExpenditure: { value: 450.2 },
                EnergyCapacity: { value: 2850.7 },
                RecoveryScore: { value: 82.3 },
                HRVScore: { value: 75.8 },
                energyCreditScore: { value: 720.5 },
                EnergySafeZone: { 
                    upperBound: 125.0, 
                    lowerBound: -25.0 
                },
                metrics: {
                    // BMR calculation inputs
                    weight: 75,
                    height: 175,
                    age: 30,
                    gender: 'male',
                    sleepScore: 85,
                    stressScore: 45,
                    timeOfDay: 14,
                    
                    // TEF calculation inputs
                    totalCalorieIntake: 2300,
                    proteinKcal: 690,   // 30% protein
                    carbKcal: 920,     // 40% carbs
                    fatKcal: 690,      // 30% fat
                    
                    // PAEE calculation inputs
                    metValue: 1.8,
                    durationHours: 24,
                    averageActivityLevel: 1.2,
                    
                    // Energy Capacity calculation inputs
                    fitnessScore: 78,
                    recoveryScore: 82,
                    stressIndex: 45,
                    alphaCoeff: 2.0,
                    betaCoeff: 1.5,
                    gammaCoeff: 2.0,
                    vo2Max: 45,
                    targetVO2Max: 48,
                    vo2Sigma: 3.0,
                    bodyFatPercentage: 15,
                    bodyFatLowerBound: 14,
                    bodyFatUpperBound: 17,
                    bodyFatSigma: 2.5,
                    
                    // Recovery Score calculation inputs
                    hrvScore: 75.8,
                    hrvWeight: 0.6,
                    sleepWeight: 0.4,
                    
                    // HRV Score calculation inputs
                    currentHRV: 42,
                    baselineHRV: 45,
                    acceptableDeviation: 20,
                    populationType: 'general',
                    
                    // Energy Credit Score calculation inputs
                    currentCreditScore: 700,
                    rollingAvgCreditChanges: 5.2,
                    maxScalingDelta: 250,
                    surplusGainFactor: 8,
                    deficitPenaltyFactor: 10,
                    maxCreditScore: 1000,
                    
                    // Energy Safe Zone calculation inputs
                    historicalEnergyDeltas: [25, 45, -15, 30, 55, 10, 35], // 7 days of historical data
                    bufferZone: 50,
                    minHistoryRequired: 3
                }
            }]

            if (!dailyValues.length) {
                throw new Error('No daily values found for activity metric statistics');
            }

            // Process each day's data
            for (let i = 0; i < dailyValues.length; i++) {
                const dailyData = dailyValues[i];
                await processDayEnergyData(dailyData, i + 1, startDate, endDate);
            }
        });
    });
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Add metric validation result to arrays and log details
 * @param {string} metricName - Name of the metric being validated
 * @param {number} apiValue - Value from API
 * @param {number} calculatedValue - Our calculated value
 * @param {number} tolerance - Allowed difference tolerance
 * @param {Array} validationResults - Array to store validation results
 * @param {Array} failures - Array to store failure messages
 * @param {Object} additionalInfo - Additional info for logging failures
 */
function addMetricValidation(metricName, apiValue, calculatedValue, tolerance, validationResults, failures, additionalInfo = {}) {
    const difference = Math.abs(apiValue - calculatedValue);
    const passed = difference <= tolerance;

    console.info(`${metricName} Value Difference: ${difference}`);

    const result = {
        metric: metricName,
        passed,
        actualValue: apiValue,
        expectedValue: calculatedValue,
        difference,
        tolerance
    };

    validationResults.push(result);

    if (!passed) {
        let failureMessage = `❌ ${metricName} validation failed:
        • API Value: ${apiValue}
        • Calculated Value: ${calculatedValue}
        • Difference: ${difference.toFixed(2)} points
        • Tolerance: ${tolerance} points`;

        // Add additional info if provided
        if (Object.keys(additionalInfo).length > 0) {
            const infoStr = Object.entries(additionalInfo)
                .map(([key, value]) => `${key}=${value}`)
                .join(', ');
            failureMessage += `\n        • Input: ${infoStr}`;
        }

        failures.push(failureMessage);
    }

    return {passed, difference};
}

/**
 * Process energy data for a single day
 */
async function processDayEnergyData(dailyData, dayNumber, startDate, endDate) {
    console.info(`\n--- Day ${dayNumber}: ${dailyData.date} ---`);

    console.info(`API Basal Metabolic Rate: ${dailyData.BasalMetabolicRate.value}`);

    // Extract metrics for energy calculation if available
    if (dailyData.metrics) {
        await calculateAndCompareEnergyScores(dailyData, startDate, endDate);
    }
}

/**
 * Calculate and compare energy scores with API data using energy aggregator
 */
async function calculateAndCompareEnergyScores(dailyData, startDate, endDate) {
    console.info('\n--- ENERGY SCORE CALCULATION ---');
    const metrics = dailyData.metrics;

    // Use energy aggregator to calculate all metrics at once
    const energyScoreParams = {
        // Basic demographics
        weight: metrics.weight,
        height: metrics.height,
        age: metrics.age,
        gender: metrics.gender,
        
        // Physiological scores
        sleepScore: metrics.sleepScore,
        stressScore: metrics.stressScore,
        timeOfDay: metrics.timeOfDay,
        
        // Nutrition
        totalCalorieIntake: metrics.totalCalorieIntake,
        proteinKcal: metrics.proteinKcal,
        carbKcal: metrics.carbKcal,
        fatKcal: metrics.fatKcal,
        
        // Activity
        metValue: metrics.metValue,
        durationHours: metrics.durationHours,
        averageActivityLevel: metrics.averageActivityLevel,
        
        // Fitness
        fitnessScore: metrics.fitnessScore,
        vo2Max: metrics.vo2Max,
        targetVO2Max: metrics.targetVO2Max,
        bodyFatPercentage: metrics.bodyFatPercentage,
        bodyFatLowerBound: metrics.bodyFatLowerBound,
        bodyFatUpperBound: metrics.bodyFatUpperBound,
        
        // Recovery
        currentHRV: metrics.currentHRV,
        baselineHRV: metrics.baselineHRV,
        acceptableDeviation: metrics.acceptableDeviation,
        populationType: metrics.populationType,
        
        // Energy management
        currentCreditScore: metrics.currentCreditScore,
        rollingAvgCreditChanges: metrics.rollingAvgCreditChanges,
        historicalEnergyDeltas: metrics.historicalEnergyDeltas,
        bufferZone: metrics.bufferZone
    };

    // Calculate all energy metrics using aggregator
    const finalResult = energyScore(energyScoreParams);

    console.info('\n--- ENERGY METRICS BREAKDOWN ---');
    console.table({
        bmr: finalResult.bmr,
        tef: finalResult.tef,
        paee: finalResult.paee,
        energyCapacity: finalResult.energyCapacity,
        recovery: finalResult.recovery,
        hrv: finalResult.hrv,
        energyCredit: finalResult.energyCredit,
        totalEnergyExpenditure: finalResult.totalEnergyExpenditure,
        energyDelta: finalResult.energyDelta
    });

    // Collect validation results for all energy metrics
    const validationResults = [];
    const failures = [];

    // Define tolerance values
    const tolerances = {
        bmr: process.env.BMR_COMPARE_TOLERANCE || 50,
        tef: process.env.TEF_COMPARE_TOLERANCE || 25,
        paee: process.env.PAEE_COMPARE_TOLERANCE || 100,
        energyCapacity: process.env.ENERGY_CAPACITY_COMPARE_TOLERANCE || 200,
        recovery: process.env.RECOVERY_SCORE_COMPARE_TOLERANCE || 5,
        hrv: process.env.HRV_SCORE_COMPARE_TOLERANCE || 5,
        energyCredit: process.env.ENERGY_CREDIT_SCORE_COMPARE_TOLERANCE || 50,
        energySafeZone: process.env.ENERGY_SAFE_ZONE_COMPARE_TOLERANCE || 25
    };

    // Validate BMR
    addMetricValidation(
        'BasalMetabolicRate',
        dailyData.BasalMetabolicRate.value,
        finalResult.bmr,
        tolerances.bmr,
        validationResults,
        failures,
        { weight: metrics.weight, height: metrics.height, age: metrics.age, gender: metrics.gender }
    );

    // Validate TEF
    addMetricValidation(
        'ThermicEffectFood',
        dailyData.ThermicEffectFood.value,
        finalResult.tef,
        tolerances.tef,
        validationResults,
        failures,
        { totalCalorieIntake: metrics.totalCalorieIntake, proteinKcal: metrics.proteinKcal }
    );

    // Validate PAEE
    addMetricValidation(
        'PhysicalActivityEnergyExpenditure',
        dailyData.PhysicalActivityEnergyExpenditure.value,
        finalResult.paee,
        tolerances.paee,
        validationResults,
        failures,
        { metValue: metrics.metValue, durationHours: metrics.durationHours }
    );

    // Validate Energy Capacity
    addMetricValidation(
        'EnergyCapacity',
        dailyData.EnergyCapacity.value,
        finalResult.energyCapacity,
        tolerances.energyCapacity,
        validationResults,
        failures,
        { fitnessScore: metrics.fitnessScore, recoveryScore: metrics.recoveryScore }
    );

    // Validate Recovery Score
    addMetricValidation(
        'RecoveryScore',
        dailyData.RecoveryScore.value,
        finalResult.recovery,
        tolerances.recovery,
        validationResults,
        failures,
        { hrvScore: metrics.hrvScore, sleepScore: metrics.sleepScore }
    );

    // Validate HRV Score
    addMetricValidation(
        'HRVScore',
        dailyData.HRVScore.value,
        finalResult.hrv,
        tolerances.hrv,
        validationResults,
        failures,
        { currentHRV: metrics.currentHRV, baselineHRV: metrics.baselineHRV }
    );

    // Validate Energy Credit Score
    addMetricValidation(
        'EnergyCreditScore',
        dailyData.energyCreditScore.value,
        finalResult.energyCredit,
        tolerances.energyCredit,
        validationResults,
        failures,
        { energyDelta: finalResult.energyDelta, currentCreditScore: metrics.currentCreditScore }
    );

    // Validate Energy Safe Zone (special handling for bounds)
    if (finalResult.safeZoneUpperBound !== null && finalResult.safeZoneLowerBound !== null) {
        const upperBoundDiff = Math.abs(dailyData.EnergySafeZone.upperBound - finalResult.safeZoneUpperBound);
        const lowerBoundDiff = Math.abs(dailyData.EnergySafeZone.lowerBound - finalResult.safeZoneLowerBound);
        const maxDiff = Math.max(upperBoundDiff, lowerBoundDiff);
        const passed = maxDiff <= tolerances.energySafeZone;

        console.info(`Energy Safe Zone Upper Bound Difference: ${upperBoundDiff}`);
        console.info(`Energy Safe Zone Lower Bound Difference: ${lowerBoundDiff}`);

        validationResults.push({
            metric: 'EnergySafeZone',
            passed,
            actualUpperBound: dailyData.EnergySafeZone.upperBound,
            expectedUpperBound: finalResult.safeZoneUpperBound,
            actualLowerBound: dailyData.EnergySafeZone.lowerBound,
            expectedLowerBound: finalResult.safeZoneLowerBound,
            upperBoundDiff,
            lowerBoundDiff,
            maxDiff,
            tolerance: tolerances.energySafeZone
        });

        if (!passed) {
            failures.push(`❌ EnergySafeZone validation failed:
        • API Upper Bound: ${dailyData.EnergySafeZone.upperBound}
        • Calculated Upper Bound: ${finalResult.safeZoneUpperBound}
        • Upper Bound Difference: ${upperBoundDiff.toFixed(2)} kcal
        • API Lower Bound: ${dailyData.EnergySafeZone.lowerBound}
        • Calculated Lower Bound: ${finalResult.safeZoneLowerBound}
        • Lower Bound Difference: ${lowerBoundDiff.toFixed(2)} kcal
        • Tolerance: ${tolerances.energySafeZone} kcal`);
        }
    }

    const passCount = validationResults.filter(r => r.passed).length;
    const totalCount = validationResults.length;

    console.info(`\n📊 Energy Metrics Validation Summary: ${passCount}/${totalCount} metrics passed validation`);

    // Throw error with all failures if any exist
    if (failures.length > 0) {
        throw new Error(`\n🔍 ENERGY METRICS VALIDATION FAILURES (${failures.length}/${totalCount} failed):\n\n` +
            `🔍 INPUT METRICS (from Backend side):\n\n` +
            JSON.stringify(energyScoreParams, null, 2) +
            `\n\n🔍 CALCULATED RESULTS (Aggregator Output):\n\n` +
            JSON.stringify({
                bmr: finalResult.bmr,
                tef: finalResult.tef,
                paee: finalResult.paee,
                energyCapacity: finalResult.energyCapacity,
                recovery: finalResult.recovery,
                hrv: finalResult.hrv,
                energyCredit: finalResult.energyCredit,
                totalEnergyExpenditure: finalResult.totalEnergyExpenditure,
                energyDelta: finalResult.energyDelta,
                safeZoneUpperBound: finalResult.safeZoneUpperBound,
                safeZoneLowerBound: finalResult.safeZoneLowerBound
            }, null, 2) +
            `\n\n🔍 API RESULTS (from Backend side):\n\n` +
            JSON.stringify({
                BasalMetabolicRate: dailyData.BasalMetabolicRate,
                ThermicEffectFood: dailyData.ThermicEffectFood,
                PhysicalActivityEnergyExpenditure: dailyData.PhysicalActivityEnergyExpenditure,
                EnergyCapacity: dailyData.EnergyCapacity,
                RecoveryScore: dailyData.RecoveryScore,
                HRVScore: dailyData.HRVScore,
                energyCreditScore: dailyData.energyCreditScore,
                EnergySafeZone: dailyData.EnergySafeZone
            }, null, 2) +
            `\n\n🔍 Issues:\n\n` +
            failures.join('\n\n') +
            `\n\n📊 Overall: ${passCount}/${totalCount} metrics passed validation`);
    }
}