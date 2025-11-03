/**
 * OneVital API Activity Endpoints Tests
 *
 * Tests for activity-related health endpoints with energy score calculation.
 * Requires valid credentials in .env file.
 */

import 'dotenv/config';
import {TestHelpers, TestState} from '../utils/test-helpers.js';
import {getTestDateRange} from '../utils/date-helper.js';
import { activityScore } from '../epics/activity_aggregator.js';

describe('OneVital API Activity Endpoints', () => {
    beforeAll(async () => {
        await TestState.initialize();
    });

    afterAll(async () => {
        await TestState.cleanup();
    });

    describe('Activity Metric Types', () => {
        test('GET /api/health/activity-metric-types should return activity metric types', async () => {
            const result = await TestHelpers.testEndpoint('/api/health/activity-metric-types', 'GET', null, 200);
            TestHelpers.validateEndpointSuccess(result);

            // If we have data, validate basic structure
            if (result.data && result.data.success && result.onevitalData) {
                console.info('Activity metric types data received successfully');

                // Log basic info about the response
                const data = result.onevitalData;
                if (data.metricTypes && Array.isArray(data.metricTypes)) {
                    console.info(`Found ${data.metricTypes.length} activity metric types`);

                    // Validate structure of metric types if available
                    if (data.metricTypes.length > 0) {
                        const firstMetric = data.metricTypes[0];
                        expect(firstMetric).toHaveProperty('name');
                        expect(firstMetric).toHaveProperty('value');
                        expect(firstMetric).toHaveProperty('description');

                        expect(typeof firstMetric.name).toBe('string');
                        expect(typeof firstMetric.value).toBe('string');
                        expect(typeof firstMetric.description).toBe('string');
                    }
                }
            }
        });
    });

    describe('Activity Metric Statistics', () => {
        test('GET /api/health/activity-metric-statistics should return activity statistics and match energy calculations', async () => {
            const {startDate, endDate} = getTestDateRange();

            // Fetch and validate activity data
            const activityResult = await fetchActivityMetricStatistics(startDate, endDate);
            const dailyValues = activityResult.data.data.dailyValues?.filter(dailyValue => dailyValue.metrics);

            console.info('\n=== ACTIVITY METRIC STATISTICS ANALYSIS ===');
            console.info(`Date Range: ${startDate} to ${endDate}`);
            console.info(`Total Records: ${activityResult.data.data.totalRecords}`);

            if (!dailyValues.length) {
                throw new Error('No daily values found for activity metric statistics');
            }

            // Process each day's data
            for (let i = 0; i < dailyValues.length; i++) {
                const dailyData = dailyValues[i];
                await processDayActivityData(dailyData, i + 1, startDate, endDate);
            }
        });
    });
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Fetch activity metric statistics for the given date range
 */
async function fetchActivityMetricStatistics(startDate, endDate) {
    const endpoint = `/api/health/activity-metric-statistics?startDate=${startDate}&endDate=${endDate}`;
    const result = await TestHelpers.testEndpoint(endpoint, 'GET', null, 200);
    TestHelpers.validateEndpointSuccess(result);

    // Validate response structure
    expect(result.data).toHaveProperty('success', true);
    expect(result.data).toHaveProperty('data');
    expect(result.data.data).toHaveProperty('dailyValues');
    expect(Array.isArray(result.data.data.dailyValues)).toBe(true);

    return result;
}

/**
 * Process activity data for a single day
 */
async function processDayActivityData(dailyData, dayNumber, startDate, endDate) {
    console.info(`\n--- Day ${dayNumber}: ${dailyData.date} ---`);

    // Skip days with null data
    if (!dailyData.ActivityScore || dailyData.ActivityScore.value === null) {
        console.info('No activity data available for this day');
        return;
    }

    // Validate activity scores structure
    validateActivityScoresStructure(dailyData);
    console.info(`API Activity Score: ${dailyData.ActivityScore.value}`);

    // Extract metrics for activity calculation if available
    if (dailyData.metrics) {
        await calculateAndCompareActivityScores(dailyData, startDate, endDate);
    }
}

/**
 * Validate activity scores structure
 */
function validateActivityScoresStructure(dailyData) {
    expect(dailyData).toHaveProperty('ActivityScore');
    expect(dailyData.ActivityScore).toHaveProperty('value');
    expect(typeof dailyData.ActivityScore.value).toBe('number');
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
 * Calculate and compare activity scores with API data using activity aggregator
 */
async function calculateAndCompareActivityScores(dailyData, startDate, endDate) {
    console.info('\n--- ACTIVITY SCORE CALCULATION ---');
    const metrics = dailyData.metrics;

    // Use activity aggregator to calculate all metrics at once
    const activityScoreParams = {
        // Steps data
        stepsTodayX: metrics.stepsTodayX,
        baselineStepsMu: metrics.baselineStepsMu,
        steps7dStdDev: metrics.steps7dStdDev,
        steps7dMean: metrics.steps7dMean,
        steps7dArray: metrics.steps7dArray,
        
        // MVPA data
        mvpaMinutesToday_m: metrics.mvpaMinutesToday_m,
        mvpaRecentMean: metrics.mvpaRecentMean,
        mvpaMinRecommendedByAge: metrics.mvpaMinRecommendedByAge,
        ageGroup: metrics.ageGroup,
        
        // Activity distribution
        stepsBins: metrics.stepsBins,
        giniMeanStepsPerBin: metrics.giniMeanStepsPerBin,
        
        // Energy credit
        energyCreditCurrentScore: metrics.energyCreditCurrentScore,
        energyCreditRollingAvg: metrics.energyCreditRollingAvg
    };

    // Calculate all activity metrics using aggregator
    const finalResult = activityScore(activityScoreParams);

    console.info('\n--- ACTIVITY METRICS BREAKDOWN ---');
    console.table({
        stepsScore: finalResult.stepsScore,
        activeMinutesScore: finalResult.activeMinutesScore,
        consistencyScore: finalResult.consistencyScore,
        activityLevelConsistencyScore: finalResult.activityLevelConsistencyScore,
        totalEnergyCreditScore: finalResult.totalEnergyCreditScore,
        finalActivityScore: finalResult.finalActivityScore
    });

    // Collect validation results for all activity metrics
    const validationResults = [];
    const failures = [];

    // Define tolerance values
    const tolerances = {
        stepsScore: process.env.STEPS_SCORE_COMPARE_TOLERANCE || 0.1,
        activeMinutesScore: process.env.ACTIVE_MINUTES_SCORE_COMPARE_TOLERANCE || 0.1,
        consistencyScore: process.env.CONSISTENCY_SCORE_COMPARE_TOLERANCE || 0.1,
        activityLevelConsistencyScore: process.env.ACTIVITY_LEVEL_CONSISTENCY_COMPARE_TOLERANCE || 0.1,
        totalEnergyCreditScore: process.env.TOTAL_ENERGY_CREDIT_SCORE_COMPARE_TOLERANCE || 0.1,
        finalActivityScore: process.env.FINAL_ACTIVITY_SCORE_COMPARE_TOLERANCE || 0.1
    };

    // Validate Steps Score
    addMetricValidation(
        'StepsScore',
        dailyData.StepsScore.value,
        finalResult.stepsScore,
        tolerances.stepsScore,
        validationResults,
        failures,
        { steps: metrics.stepsTodayX, baseline: metrics.baselineStepsMu, stdDev: metrics.steps7dStdDev }
    );

    // Validate Active Minutes Score
    addMetricValidation(
        'ActiveMinutesScore',
        dailyData.ActiveMinutesScore.value,
        finalResult.activeMinutesScore,
        tolerances.activeMinutesScore,
        validationResults,
        failures,
        { mvpaToday: metrics.mvpaMinutesToday_m, mvpaRecentMean: metrics.mvpaRecentMean, ageGroup: metrics.ageGroup }
    );

    // Validate Consistency Score
    addMetricValidation(
        'ConsistencyScore',
        dailyData.ConsistencyScore.value,
        finalResult.consistencyScore,
        tolerances.consistencyScore,
        validationResults,
        failures,
        { steps7dMean: metrics.steps7dMean, steps7dStdDev: metrics.steps7dStdDev }
    );

    // Validate Activity Level Consistency Score
    addMetricValidation(
        'ActivityLevelConsistency',
        dailyData.ActivityLevelConsistency.value,
        finalResult.activityLevelConsistencyScore,
        tolerances.activityLevelConsistencyScore,
        validationResults,
        failures,
        { giniMeanStepsPerBin: metrics.giniMeanStepsPerBin, stepsBins: metrics.stepsBins ? `${metrics.stepsBins.length} bins` : 'N/A' }
    );

    // Validate Total Energy Credit Score
    addMetricValidation(
        'TotalEnergyCreditScore',
        dailyData.TotalEnergyCreditScore.value,
        finalResult.totalEnergyCreditScore,
        tolerances.totalEnergyCreditScore,
        validationResults,
        failures,
        { energyCreditCurrentScore: metrics.energyCreditCurrentScore, energyCreditRollingAvg: metrics.energyCreditRollingAvg }
    );

    // Validate Final Activity Score
    addMetricValidation(
        'FinalActivityScore',
        dailyData.ActivityScore.value,
        finalResult.finalActivityScore,
        tolerances.finalActivityScore,
        validationResults,
        failures,
        { 
            stepsScore: finalResult.stepsScore,
            activeMinutesScore: finalResult.activeMinutesScore,
            consistencyScore: finalResult.consistencyScore,
            activityLevelConsistencyScore: finalResult.activityLevelConsistencyScore,
            totalEnergyCreditScore: finalResult.totalEnergyCreditScore
        }
    );

    const passCount = validationResults.filter(r => r.passed).length;
    const totalCount = validationResults.length;

    console.info(`\n📊 Activity Metrics Validation Summary: ${passCount}/${totalCount} metrics passed validation`);

    // Throw error with all failures if any exist
    if (failures.length > 0) {
        throw new Error(`\n🔍 ACTIVITY METRICS VALIDATION FAILURES (${failures.length}/${totalCount} failed):\n\n` +
            `🔍 INPUT METRICS (from Backend side):\n\n` +
            JSON.stringify(activityScoreParams, null, 2) +
            `\n\n🔍 CALCULATED RESULTS (Aggregator Output):\n\n` +
            JSON.stringify({
                stepsScore: finalResult.stepsScore,
                activeMinutesScore: finalResult.activeMinutesScore,
                consistencyScore: finalResult.consistencyScore,
                activityLevelConsistencyScore: finalResult.activityLevelConsistencyScore,
                totalEnergyCreditScore: finalResult.totalEnergyCreditScore,
                finalActivityScore: finalResult.finalActivityScore
            }, null, 2) +
            `\n\n🔍 API RESULTS (from Backend side):\n\n` +
            JSON.stringify({
                StepsScore: dailyData.StepsScore,
                ActiveMinutesScore: dailyData.ActiveMinutesScore,
                ConsistencyScore: dailyData.ConsistencyScore,
                ActivityLevelConsistency: dailyData.ActivityLevelConsistency,
                TotalEnergyCreditScore: dailyData.TotalEnergyCreditScore,
                ActivityScore: dailyData.ActivityScore
            }, null, 2) +
            `\n\n🔍 Issues:\n\n` +
            failures.join('\n\n') +
            `\n\n📊 Overall: ${passCount}/${totalCount} metrics passed validation`);
    }
}