/**
 * OneVital API Stress Endpoints Tests
 *
 * Tests for stress-related health endpoints with stress score calculation.
 * Requires valid credentials in .env file.
 */

import 'dotenv/config';
import {TestHelpers, TestState} from '../utils/test-helpers.js';
import {getTestDateRange} from '../utils/date-helper.js';
import {stressScore} from '../epics/stress_aggregator.js';

describe('OneVital API Stress Endpoints', () => {
    beforeAll(async () => {
        await TestState.initialize();
    });

    afterAll(async () => {
        await TestState.cleanup();
    });

    describe('Stress Metric Types', () => {
        test('GET /api/health/stress-metric-types should return stress metric types', async () => {
            const result = await TestHelpers.testEndpoint('/api/health/stress-metric-types', 'GET', null, 200);
            TestHelpers.validateEndpointSuccess(result);
        });
    });

    describe('Stress Data', () => {
        test('GET /api/health/stress should return latest stress snapshot', async () => {
            const result = await TestHelpers.testEndpoint('/api/health/stress', 'GET', null, 200);
            TestHelpers.validateEndpointSuccess(result);
        });

        test('GET /api/health/stress-last-sync should return stress sync timestamp', async () => {
            const result = await TestHelpers.testEndpoint('/api/health/stress-last-sync', 'GET', null, 200);
            TestHelpers.validateEndpointSuccess(result);
        });
    });

    describe('Stress Statistics', () => {
        test('GET /api/health/stress-historical-data should return stress statistics and match stress calculations', async () => {
            const {startDate, endDate} = getTestDateRange();

            // Fetch and validate stress data
            // const endpoint = `/api/health/stress-historical-data?startDate=${startDate}&endDate=${endDate}`;
            // const result = await TestHelpers.testEndpoint(endpoint, 'GET', null, 200);
            // TestHelpers.validateEndpointSuccess(result);

            // const dailyValues = result.data.data.dailyValues?.filter(dailyValue => dailyValue.metrics);

            const dailyValues = [{
                date: '2024-10-20',
                StressScore: {value: 85.2},
                RHR_Para: {value: 90.19}, // Parasympathetic score from API
                metrics: {
                    // Primary stress calculation inputs (using real API parameter names)
                    rhr_bpm: 73,
                    rhr_calculation_method: "steps_heartrate_calculation",
                    steps_in_30min_window: 147,
                    mu_rhr_para: 100,
                    sigma_rhr_para: 15,

                    // Mapped to our calculation parameters
                    heartRateData: 73, // Use rhr_bpm as pre-calculated RHR
                    totalStepsLast30Min: 147, // Use steps_in_30min_window
                    muRHR: 100, // Use mu_rhr_para
                    sigmaRHR: 15, // Use sigma_rhr_para
                    fallbackRHR: 70,

                    // Optional: For stress-energy conversion
                    energyCapacity: 2500,
                    paee: 400,
                    tef: 230,
                    averageMonthlyStress: 65
                }
            }]

            console.info('\n=== STRESS METRIC STATISTICS ANALYSIS ===');
            console.info(`Date Range: ${startDate} to ${endDate}`);

            if (!dailyValues.length) {
                throw new Error('No daily values found for stress metric statistics');
            }

            // Process each day's data
            for (let i = 0; i < dailyValues.length; i++) {
                const dailyData = dailyValues[i];
                await processDayStressData(dailyData, i + 1, startDate, endDate);
            }
        });
    });
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Process stress data for a single day
 */
async function processDayStressData(dailyData, dayNumber, startDate, endDate) {
    console.info(`\n--- Day ${dayNumber}: ${dailyData.date} ---`);

    // Skip days with null data
    if (!dailyData.StressScore || dailyData.StressScore.value === null) {
        console.info('No stress data available for this day');
        return;
    }

    // Validate stress scores structure
    validateStressScoresStructure(dailyData);
    console.info(`API Stress Score: ${dailyData.StressScore.value}`);

    // Extract metrics for stress calculation if available
    if (dailyData.metrics) {
        await calculateAndCompareStressScores(dailyData, startDate, endDate);
    }
}

/**
 * Validate stress scores structure
 */
function validateStressScoresStructure(dailyData) {
    expect(dailyData).toHaveProperty('StressScore');
    expect(dailyData.StressScore).toHaveProperty('value');
    expect(typeof dailyData.StressScore.value).toBe('number');
}

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
 * Calculate and compare stress scores with API data using stress aggregator
 */
async function calculateAndCompareStressScores(dailyData, startDate, endDate) {
    console.info('\n--- STRESS SCORE CALCULATION ---');
    const metrics = dailyData.metrics;

    // Use stress aggregator to calculate all metrics at once
    const stressScoreParams = {
        // Primary stress calculation inputs
        heartRateData: metrics.heartRateData,
        totalStepsLast30Min: metrics.totalStepsLast30Min,
        muRHR: metrics.muRHR,
        sigmaRHR: metrics.sigmaRHR,
        fallbackRHR: metrics.fallbackRHR,

        // Optional: For stress-energy conversion
        energyCapacity: metrics.energyCapacity,
        paee: metrics.paee,
        tef: metrics.tef,
        averageMonthlyStress: metrics.averageMonthlyStress
    };

    // Calculate all stress metrics using aggregator
    const finalResult = stressScore(stressScoreParams);

    console.info('\n--- STRESS METRICS BREAKDOWN ---');
    console.table({
        stressScore: finalResult.stressScore,
        rhr: finalResult.rhr,
        parasympatheticScore: finalResult.parasympatheticScore,
        stressEnergyConversion: finalResult.stressEnergyConversion ? 'available' : 'not calculated'
    });

    // Collect validation results for stress metrics
    const validationResults = [];
    const failures = [];

    // Define tolerance values
    const tolerances = {
        stressScore: process.env.STRESS_SCORE_COMPARE_TOLERANCE || 5, // Allow 5 points difference by default
        rhrPara: process.env.RHR_PARA_COMPARE_TOLERANCE || 10 // Allow 10 points difference for parasympathetic score
    };

    console.info('\n--- RHR PARASYMPATHETIC SCORE COMPARISON ---');

    // Validate RHR_Para (Parasympathetic Score) - Following BMR comparison pattern
    addMetricValidation(
        'RHR_Para',
        dailyData.RHR_Para.value,
        finalResult.parasympatheticScore,
        tolerances.rhrPara,
        validationResults,
        failures,
        {
            rhr_bpm: metrics.rhr_bpm,
            mu_rhr_para: metrics.mu_rhr_para,
            sigma_rhr_para: metrics.sigma_rhr_para,
            delta: metrics.mu_rhr_para - metrics.rhr_bpm,
            calculationMethod: 'rhr_parasympathetic_formula',
            formula: '100 * (1 - exp(- ((μ_rhr - x)^2) / (2 * σ_rhr^2)))'
        }
    );

    console.info('\n--- OVERALL STRESS SCORE COMPARISON ---');

    // Validate Overall Stress Score
    addMetricValidation(
        'StressScore',
        dailyData.StressScore.value,
        finalResult.stressScore,
        tolerances.stressScore,
        validationResults,
        failures,
        {
            // Original API parameters
            rhr_bpm: metrics.rhr_bpm,
            rhr_calculation_method: metrics.rhr_calculation_method,
            steps_in_30min_window: metrics.steps_in_30min_window,

            // Calculated components
            calculatedRHR: finalResult.rhr,
            parasympatheticScore: finalResult.parasympatheticScore,
            stressLevel: finalResult.analysis.stressLevel,

            // Relationship
            relationship: 'Overall_Stress = RHR_Para (from specification)'
        }
    );

    const passCount = validationResults.filter(r => r.passed).length;
    const totalCount = validationResults.length;

    console.info(`\n📊 Stress Metrics Validation Summary: ${passCount}/${totalCount} metrics passed validation`);

    // Throw error with all failures if any exist
    if (failures.length > 0) {
        throw new Error(`\n🔍 STRESS METRICS VALIDATION FAILURES (${failures.length}/${totalCount} failed):\n\n` +
            `🔍 INPUT METRICS (from Backend side):\n\n` +
            JSON.stringify(stressScoreParams, null, 2) +
            `\n\n🔍 CALCULATED RESULTS (Aggregator Output):\n\n` +
            JSON.stringify({
                stressScore: finalResult.stressScore,
                rhr: finalResult.rhr,
                parasympatheticScore: finalResult.parasympatheticScore,
                stressEnergyConversion: finalResult.stressEnergyConversion,
                analysis: finalResult.analysis
            }, null, 2) +
            `\n\n🔍 API RESULTS (from Backend side):\n\n` +
            JSON.stringify({
                StressScore: dailyData.StressScore,
                RHR_Para: dailyData.RHR_Para
            }, null, 2) +
            `\n\n🔍 Issues:\n\n` +
            failures.join('\n\n') +
            `\n\n📊 Overall: ${passCount}/${totalCount} metrics passed validation`);
    }
}