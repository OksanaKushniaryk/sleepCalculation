/**
 * OneVital API Activity Endpoints Tests
 *
 * Tests for activity-related health endpoints with energy score calculation.
 * Requires valid credentials in .env file.
 */

import 'dotenv/config';
import {TestHelpers, TestState} from '../utils/test-helpers.js';
import {getTestDateRange} from '../utils/date-helper.js';
import {calculateStepsScore, compareStepsScores} from '../epics/activity/steps-score.js';
import {calculateActiveMinutesScore, compareActiveMinutesScores} from '../epics/activity/active-minutes-score.js';
import {calculateConsistencyScore, compareConsistencyScores} from '../epics/activity/consistency-score.js';
import {
    calculateActivityLevelConsistencyScore,
    compareActivityLevelConsistencyScores
} from '../epics/activity/activity-level-consistency.js';
import {
    calculateTotalEnergyCreditScore,
    compareTotalEnergyCreditScores
} from '../epics/activity/total-energy-credit-score.js';
import {calculateFinalActivityScore, compareFinalActivityScores} from '../epics/activity/final-activity-score.js';

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

    // Extract metrics for energy calculation if available
    if (dailyData.metrics) {
        await calculateAndCompareEnergyScores(dailyData, startDate, endDate);
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
 * Calculate and compare energy scores with API data
 */
async function calculateAndCompareEnergyScores(dailyData, startDate, endDate) {
    console.info('\n--- ENERGY SCORE CALCULATION ---');
    const metrics = dailyData.metrics;

    // Collect validation results for all activity metrics
    const validationResults = [];
    const failures = [];

    console.info('\n--- STEPS SCORE COMPARISON ---');

    const calculatedStepsScore = calculateStepsScore(metrics.stepsTodayX, metrics.baselineStepsMu, metrics.steps7dStdDev, metrics.steps7dMean);
    const apiStepsScore = dailyData.StepsScore;

    const comparison = compareStepsScores(calculatedStepsScore, apiStepsScore, metrics);

    addMetricValidation(
        'StepsScore',
        comparison.apiScore.value,
        comparison.calculatedScore.value,
        0.1,
        validationResults,
        failures,
        {
            steps: metrics.stepsTodayX,
            baseline: metrics.baselineStepsMu,
            stdDev: metrics.steps7dStdDev
        }
    );

    console.info('\n--- ACTIVE MINUTES SCORE COMPARISON ---');

    const calculatedActiveMinutesScore = calculateActiveMinutesScore(
        metrics.mvpaMinutesToday_m,
        metrics.mvpaRecentMean,
        metrics.mvpaMinRecommendedByAge,
        metrics.ageGroup
    );
    const apiActiveMinutesScore = dailyData.ActiveMinutesScore;

    const activeMinutesComparison = compareActiveMinutesScores(calculatedActiveMinutesScore, apiActiveMinutesScore, metrics);

    addMetricValidation(
        'ActiveMinutesScore',
        activeMinutesComparison.apiScore.value,
        activeMinutesComparison.calculatedScore.value,
        0.1,
        validationResults,
        failures,
        {
            mvpaToday: metrics.mvpaMinutesToday_m,
            mvpaRecentMean: metrics.mvpaRecentMean,
            mvpaRecommended: metrics.mvpaMinRecommendedByAge,
            ageGroup: metrics.ageGroup
        }
    );

    console.info(activeMinutesComparison.message);

    console.info('\n--- CONSISTENCY SCORE COMPARISON ---');

    const calculatedConsistencyScore = calculateConsistencyScore(
        metrics.steps7dArray,
        metrics.steps7dMean,
        metrics.steps7dStdDev
    );
    const apiConsistencyScore = dailyData.ConsistencyScore;

    const consistencyComparison = compareConsistencyScores(calculatedConsistencyScore, apiConsistencyScore, metrics);

    addMetricValidation(
        'ConsistencyScore',
        consistencyComparison.apiScore.value,
        consistencyComparison.calculatedScore.value,
        0.1,
        validationResults,
        failures,
        {
            steps7dMean: metrics.steps7dMean,
            steps7dStdDev: metrics.steps7dStdDev,
            calculatedStdDev: metrics.steps7dArray ? 'from_array' : 'from_metric'
        }
    );

    console.info('\n--- ACTIVITY LEVEL CONSISTENCY SCORE COMPARISON ---');

    const calculatedActivityLevelConsistencyScore = calculateActivityLevelConsistencyScore(
        metrics.stepsBins,
        metrics.giniMeanStepsPerBin
    );
    const apiActivityLevelConsistencyScore = dailyData.ActivityLevelConsistency;

    const activityLevelConsistencyComparison = compareActivityLevelConsistencyScores(calculatedActivityLevelConsistencyScore, apiActivityLevelConsistencyScore, metrics);

    addMetricValidation(
        'ActivityLevelConsistency',
        activityLevelConsistencyComparison.apiScore.value,
        activityLevelConsistencyComparison.calculatedScore.value,
        0.1,
        validationResults,
        failures,
        {
            giniMeanStepsPerBin: metrics.giniMeanStepsPerBin,
            stepsBins: metrics.stepsBins ? `${metrics.stepsBins.length} bins` : 'N/A',
            calculationMethod: metrics.giniMeanStepsPerBin !== undefined ? 'from_gini_metric' : 'from_bins_array'
        }
    );

    console.info('\n--- TOTAL ENERGY CREDIT SCORE COMPARISON ---');

    const calculatedTotalEnergyCreditScore = calculateTotalEnergyCreditScore(
        metrics.energyCreditCurrentScore,
        metrics.energyCreditRollingAvg
    );
    const apiTotalEnergyCreditScore = dailyData.TotalEnergyCreditScore;

    const totalEnergyCreditComparison = compareTotalEnergyCreditScores(calculatedTotalEnergyCreditScore, apiTotalEnergyCreditScore, metrics);

    addMetricValidation(
        'TotalEnergyCreditScore',
        totalEnergyCreditComparison.apiScore.value,
        totalEnergyCreditComparison.calculatedScore.value,
        0.1,
        validationResults,
        failures,
        {
            energyCreditCurrentScore: metrics.energyCreditCurrentScore,
            energyCreditRollingAvg: metrics.energyCreditRollingAvg,
            calculatedSum: (metrics.energyCreditCurrentScore || 0) + (metrics.energyCreditRollingAvg || 0)
        }
    );

    // Calculate and compare Final Activity Score using all component scores
    console.info('\n--- FINAL ACTIVITY SCORE COMPARISON ---');

    const componentScores = {
        stepsScore: calculatedStepsScore.value,
        activeMinutesScore: calculatedActiveMinutesScore.value,
        consistencyScore: calculatedConsistencyScore.value,
        activityLevelConsistencyScore: calculatedActivityLevelConsistencyScore.value,
        totalEnergyCreditScore: calculatedTotalEnergyCreditScore.value
    };

    const calculatedFinalActivityScore = calculateFinalActivityScore(
        componentScores.stepsScore,
        componentScores.activeMinutesScore,
        componentScores.consistencyScore,
        componentScores.activityLevelConsistencyScore,
        componentScores.totalEnergyCreditScore
    );

    const apiFinalActivityScore = dailyData.ActivityScore;
    const finalActivityComparison = compareFinalActivityScores(calculatedFinalActivityScore, apiFinalActivityScore, componentScores);

    addMetricValidation(
        'FinalActivityScore',
        finalActivityComparison.apiScore.value,
        finalActivityComparison.calculatedScore.value,
        0.1,
        validationResults,
        failures,
        {
            stepsScore: componentScores.stepsScore,
            activeMinutesScore: componentScores.activeMinutesScore,
            consistencyScore: componentScores.consistencyScore,
            activityLevelConsistencyScore: componentScores.activityLevelConsistencyScore,
            totalEnergyCreditScore: componentScores.totalEnergyCreditScore,
            weightedSum: calculatedFinalActivityScore.value
        }
    );

    const passCount = validationResults.filter(r => r.passed).length;
    const totalCount = validationResults.length;

    if (totalCount > 0) {
        console.info(`\n📊 Activity Metrics Validation Summary: ${passCount}/${totalCount} metrics passed validation`);

        // Throw error with all failures if any exist
        if (failures.length > 0) {
            throw new Error(`\n🔍 ACTIVITY METRICS VALIDATION FAILURES (${failures.length}/${totalCount} failed):\n\n` +
                `🔍 INPUT METRICS (from Backend side):\n\n` +
                JSON.stringify(metrics, null, 2) +
                `\n\n🔍 API RESULTS (from Backend side):\n\n` +
                JSON.stringify({
                    StepsScore: dailyData.StepsScore,
                    ConsistencyScore: dailyData.ConsistencyScore,
                    ActiveMinutesScore: dailyData.ActiveMinutesScore,
                    ActivityLevelConsistency: dailyData.ActivityLevelConsistency,
                    TotalEnergyCreditScore: dailyData.TotalEnergyCreditScore,
                    ActivityScore: dailyData.ActivityScore
                }, null, 2) +
                `\n\n🔍 Issues:\n\n` +
                failures.join('\n\n') +
                `\n\n📊 Overall: ${passCount}/${totalCount} metrics passed validation`);
        }
    }
}