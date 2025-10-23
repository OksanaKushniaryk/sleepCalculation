/**
 * OneVital API Sleep Endpoints Tests
 *
 * Tests for sleep-related health endpoints with comprehensive validation.
 * Requires valid credentials in .env file.
 */

import 'dotenv/config';
import {TestState, TestHelpers} from '../utils/test-helpers.js';
import {getTestDateRange, getShortTestDateRange} from '../utils/date-helper.js';
import {sleepScore} from '../epics/sleep_aggregator.js';

describe('OneVital API Sleep Endpoints', () => {
  beforeAll(async () => {
    await TestState.initialize();
  });

  afterAll(async () => {
    await TestState.cleanup();
  });

  describe('Sleep Metric Types', () => {
    test('GET /api/health/sleep-metric-types should return available metric types', async () => {
      const result = await TestHelpers.testEndpoint('/api/health/sleep-metric-types', 'GET', null, 200);
      TestHelpers.validateSleepMetricTypesResponse(result);
    });
  });

  describe('Sleep Sessions', () => {
    test('GET /api/health/sleep should retrieve sleep sessions', async () => {
      // Use proper ISO format with timezone like in curl example
      const from = '2025-01-01T00:00:00Z';
      const to = '2025-12-30T23:59:59Z';
      const params = new URLSearchParams({ from, to });

      const endpoint = `/api/health/sleep?${params.toString()}`;
      const result = await TestHelpers.testEndpoint(endpoint, 'GET', null, 200);
      TestHelpers.validateOneVitalResponse(result);
    });

    test('GET /api/health/sleep-last-sync should return last sync timestamp', async () => {
      const result = await TestHelpers.testEndpoint('/api/health/sleep-last-sync', 'GET', null, 200);
      TestHelpers.validateEndpointSuccess(result);
    });
  });

  describe('Sleep Metric Statistics', () => {
    test('GET /api/health/sleep-metric-statistics should return metric statistics and match sleepScore function output', async () => {
      // Use configurable date range from environment or defaults to last 30 days
      const { startDate, endDate } = getTestDateRange();

      const endpoint = `/api/health/sleep-metric-statistics?startDate=${startDate}&endDate=${endDate}`;
      const result = await TestHelpers.testEndpoint(endpoint, 'GET', null, 200);

      // Validate OneVital response structure for sleep-metric-statistics
      const validation = TestHelpers.validateOneVitalResponse(result);
      const data = validation.response.onevitalData;

      // Check if we have data for validation
      if (data.dailyValues && Array.isArray(data.dailyValues)) {
        expect(data.dailyValues).toBeDefined();
        console.info(`Found ${data.dailyValues.length} daily values for sleep metrics testing`);
      } else {
        console.info('No daily values found in API response - skipping detailed validation');
        return; // Skip further validation if no data
      }

      if (!(data && data.dailyValues && data.dailyValues.length > 0)) {
        return;
      }

      const firstDay = data.dailyValues && data.dailyValues[0];

      // Test metrics object structure
      expect(firstDay.metrics).toBeDefined();
      expect(firstDay.metrics.totalSleepTimeHours).toBeDefined();
      expect(firstDay.metrics.timeInBedHours).toBeDefined();
      expect(firstDay.metrics.deepSleepPercent).toBeDefined();
      expect(firstDay.metrics.remSleepPercent).toBeDefined();
      expect(firstDay.metrics.deepSleepHours).toBeDefined();
      expect(firstDay.metrics.remSleepHours).toBeDefined();
      expect(firstDay.metrics.lightSleepHours).toBeDefined();
      expect(firstDay.metrics.wakeAfterSleepOnsetHours).toBeDefined();
      expect(firstDay.metrics.sleepOnsetLatencyMinutes).toBeDefined();
      expect(firstDay.metrics.wasoMinutes).toBeDefined();
      expect(firstDay.metrics.heartRateDipPercent).toBeDefined();
      expect(firstDay.metrics.sleepCyclesCount).toBeDefined();
      expect(firstDay.metrics.avgSleepHeartRateBpm).toBeDefined();
      expect(firstDay.metrics.avgRestingHeartRateBpm).toBeDefined();
      expect(firstDay.metrics.circadianMidpointHours).toBeDefined();
      expect(firstDay.metrics.averageDayToDayVariationHours).toBeDefined();

      // Test all score components structure
      const scoreComponents = [
        'SleepScore', 'TotalSleepDuration', 'SleepEfficiency', 'DeepSleep',
        'RemSleep', 'SleepOnsetLatency', 'WASO', 'HRDip', 'SleepConsistency',
        'CircadianAlignment', 'SleepCycles', 'SleepStageDistribution', 'TemperatureDeviation'
      ];

      scoreComponents.forEach(component => {
        expect(firstDay[component]).toBeDefined();
        expect(firstDay[component]).toHaveProperty('value');
        expect(firstDay[component]).toHaveProperty('normDeviation');
        expect(firstDay[component]).toHaveProperty('trend');

        // Validate value types (null is acceptable for some metrics like TemperatureDeviation)
        if (firstDay[component].value !== null) {
          expect(typeof firstDay[component].value).toBe('number');
          expect(firstDay[component].value).toBeGreaterThanOrEqual(0);
          expect(firstDay[component].value).toBeLessThanOrEqual(100);
        }

        // Validate normDeviation and trend (can be null)
        if (firstDay[component].normDeviation !== null) {
          expect(typeof firstDay[component].normDeviation).toBe('number');
          expect(firstDay[component].normDeviation).toBeGreaterThanOrEqual(0);
          expect(firstDay[component].normDeviation).toBeLessThanOrEqual(2);
        }

        if (firstDay[component].trend !== null) {
          expect(typeof firstDay[component].trend).toBe('number');
          expect(firstDay[component].trend).toBeGreaterThanOrEqual(0);
          expect(firstDay[component].trend).toBeLessThanOrEqual(2);
        }
      });

      // Test sleepScore function with API data
      await validateSleepScoreFunction(firstDay);
    });

    test('should validate specific metric calculations from API response', async () => {
      // Use short date range (7 days) for this specific validation test
      const { startDate, endDate } = getShortTestDateRange(7);

      const endpoint = `/api/health/sleep-metric-statistics?startDate=${startDate}&endDate=${endDate}`;
      const result = await TestHelpers.testEndpoint(endpoint, 'GET', null, 200);

      // Validate OneVital response structure for sleep-metric-statistics
      const validation = TestHelpers.validateOneVitalResponse(result);
      const data = validation.response.onevitalData;

      if (data && data.dailyValues && data.dailyValues.length > 0) {
        data.dailyValues.forEach((day, index) => {
          console.info(`Validating day ${index + 1} metrics:`, day.date);
          
          // Validate metric value ranges
          validateMetricRanges(day);
          
          // Validate trends and normDeviations
          validateTrendsAndDeviations(day);
          
          // Validate metrics consistency
          validateMetricsConsistency(day);
        });
      }
    });
  });

  describe('Sleep Score Function Testing', () => {
    test('should test sleepScore function with various API data scenarios', async () => {
      // Test scenario 1: Good sleep data (from your sample)
      const goodSleepData = {
        deepH: 0, deepM: 58, // 0.96 hours = 58 minutes
        coreH: 5, coreM: 31, // 5.51 hours = 5 hours 31 minutes
        remH: 1, remM: 51,   // 1.85 hours = 1 hour 51 minutes
        awakeH: 0, awakeM: 9, // 0.15 hours = 9 minutes
        restingHR: 92, sleepHR: 59,
        fellAsleep: "23:46", // Calculated from circadian midpoint 23.76
        tst: "8:19", // 8.32 hours = 8 hours 19 minutes
        observedCycles: 5,
        scsX: 0.47
      };

      console.info('Testing sleepScore with good sleep data:');
      expect(() => {
        sleepScore(goodSleepData);
      }).not.toThrow();

      // Test scenario 2: Poor sleep data (from your sample)
      const poorSleepData = {
        deepH: 0, deepM: 8,  // 0.14 hours = 8 minutes (very low deep sleep)
        coreH: 6, coreM: 25, // 6.42 hours = 6 hours 25 minutes
        remH: 1, remM: 13,   // 1.21 hours = 1 hour 13 minutes
        awakeH: 0, awakeM: 25, // 0.42 hours = 25 minutes
        restingHR: 92, sleepHR: 59,
        fellAsleep: "23:49", // Calculated from circadian midpoint 23.81
        tst: "7:46", // 7.77 hours = 7 hours 46 minutes
        observedCycles: 4,
        scsX: 0.44
      };

      console.info('Testing sleepScore with poor sleep data:');
      expect(() => {
        sleepScore(poorSleepData);
      }).not.toThrow();

      // Test additional edge cases
      testSleepScoreEdgeCases();
    });
  });
});

/**
 * Helper function to validate sleep score function with API data
 */
async function validateSleepScoreFunction(firstDay) {
  // Convert API metrics to sleepScore function parameters
  const metrics = firstDay.metrics;

  // Calculate sleep stage hours from API data
  const totalSleepHours = metrics.totalSleepTimeHours;
  const deepSleepHours = metrics.deepSleepHours;
  const remSleepHours = metrics.remSleepHours;
  const lightSleepHours = metrics.lightSleepHours;
  const wakeHours = metrics.wakeAfterSleepOnsetHours;

  // Convert hours to hours and minutes for sleepScore function
  const deepH = Math.floor(deepSleepHours);
  const deepM = Math.round((deepSleepHours - deepH) * 60);
  const coreH = Math.floor(lightSleepHours);
  const coreM = Math.round((lightSleepHours - coreH) * 60);
  const remH = Math.floor(remSleepHours);
  const remM = Math.round((remSleepHours - remH) * 60);
  const awakeH = Math.floor(wakeHours);
  const awakeM = Math.round((wakeHours - awakeH) * 60);

  // Calculate total sleep time string
  const totalH = Math.floor(totalSleepHours);
  const totalM = Math.round((totalSleepHours - totalH) * 60);
  const tst = `${totalH}:${totalM.toString().padStart(2, '0')}`;

  // Calculate fell asleep time from circadian midpoint
  // Assuming 8 hours of sleep, fell asleep would be midpoint - 4 hours
  const midpointHours = metrics.circadianMidpointHours;
  const fellAsleepDecimal = (midpointHours - 4 + 24) % 24;
  const fellAsleepH = Math.floor(fellAsleepDecimal);
  const fellAsleepM = Math.round((fellAsleepDecimal - fellAsleepH) * 60);
  const fellAsleep = `${fellAsleepH.toString().padStart(2, '0')}:${fellAsleepM.toString().padStart(2, '0')}`;

  console.info('🔍 TESTING SLEEPSCORE FUNCTION WITH API DATA 🔍');
  console.info('='.repeat(50));
  const sleepScoreParams = {
    deepH, deepM,
    coreH, coreM,
    remH, remM,
    awakeH, awakeM,
    restingHR: Math.round(metrics.avgRestingHeartRateBpm),
    sleepHR: Math.round(metrics.avgSleepHeartRateBpm),
    fellAsleep,
    tst,
    observedCycles: metrics.sleepCyclesCount,
    scsX: metrics.averageDayToDayVariationHours
  };

  console.info('SleepScore parameters:', sleepScoreParams);

  const finalResult = sleepScore(sleepScoreParams);
  console.info('FinalResult from sleepScore function:', finalResult);

  // Compare finalResult with API endpoint response values
  expect(finalResult).toBeDefined();
  expect(finalResult.tsd).toBeDefined(); // Total Sleep Duration
  expect(finalResult.se).toBeDefined();  // Sleep Efficiency  
  expect(finalResult.dss).toBeDefined(); // Deep Sleep Score
  expect(finalResult.rss).toBeDefined(); // REM Sleep Score
  expect(finalResult.sol).toBeDefined(); // Sleep Onset Latency
  expect(finalResult.waso).toBeDefined(); // Wake After Sleep Onset
  expect(finalResult.hrd).toBeDefined(); // Heart Rate Dip
  expect(finalResult.scs).toBeDefined(); // Sleep Consistency Score
  expect(finalResult.cas).toBeDefined(); // Circadian Alignment Score
  expect(finalResult.nsc).toBeDefined(); // Number of Sleep Cycles
  expect(finalResult.ssd).toBeDefined(); // Sleep Stage Distribution

  // Compare values with tolerance
  compareMetricsWithTolerance(finalResult, firstDay);

  return finalResult;
}

/**
 * Compare sleep metrics with tolerance
 */
function compareMetricsWithTolerance(finalResult, firstDay) {
  // Map sleepScore function results to API response format for comparison
  const actualValues = {
    TotalSleepDuration: { value: finalResult.tsd },
    SleepEfficiency: { value: finalResult.se },
    DeepSleep: { value: finalResult.dss },
    RemSleep: { value: finalResult.rss },
    SleepOnsetLatency: { value: finalResult.sol },
    WASO: { value: finalResult.waso },
    HRDip: { value: finalResult.hrd },
    SleepConsistency: { value: finalResult.scs },
    CircadianAlignment: { value: finalResult.cas },
    SleepCycles: { value: finalResult.nsc },
    SleepStageDistribution: { value: finalResult.ssd }
  };

  // Use the actual API response data from firstDay for comparison
  const expectedValues = {
    TotalSleepDuration: firstDay.TotalSleepDuration,
    SleepEfficiency: firstDay.SleepEfficiency,
    DeepSleep: firstDay.DeepSleep,
    RemSleep: firstDay.RemSleep,
    SleepOnsetLatency: firstDay.SleepOnsetLatency,
    WASO: firstDay.WASO,
    HRDip: firstDay.HRDip,
    SleepConsistency: firstDay.SleepConsistency,
    CircadianAlignment: firstDay.CircadianAlignment,
    SleepCycles: firstDay.SleepCycles,
    SleepStageDistribution: firstDay.SleepStageDistribution
  };

  console.info('Actual values from sleepScore function:', actualValues);
  console.info('Expected values from API:', expectedValues);

  // Compare each metric with tolerance - collect all failures to show complete picture
  const validationResults = [];
  const failures = [];
  
  Object.keys(expectedValues).forEach(metric => {
    const actual = actualValues[metric];
    const expected = expectedValues[metric];
    
    if (actual && actual.value !== null && expected && expected.value !== null) {
      const diff = Math.abs(actual.value - expected.value);
      
      // Use precision tolerance of 0.1 (1 decimal place) for all metrics
      const tolerance = 0.1;
      
      const passed = diff <= tolerance;
      const status = passed ? '✅ PASS' : '❌ FAIL';
      
      const result = {
        metric,
        expected: expected.value,
        actual: actual.value,
        diff: diff.toFixed(2),
        tolerance,
        passed,
        status
      };
      
      validationResults.push(result);
      
      if (!passed) {
        failures.push(`❌ ${metric} validation failed:
        • Difference: ${diff.toFixed(2)} points
        • Tolerance: ${tolerance} points  
        • Expected (API): ${expected.value}
        • Actual (sleepScore): ${actual.value}
        • Calculation: |${actual.value} - ${expected.value}| = ${diff.toFixed(2)} > ${tolerance}`);
      }
      
      console.info(`${status} ${metric}: Expected ${expected.value}, Got ${actual.value}, Diff: ${diff.toFixed(2)} (tolerance: ${tolerance})`);
    }
  });
  
  // Display summary table of all comparisons
  console.info('\n📊 SLEEP METRICS COMPARISON SUMMARY');
  console.info('='.repeat(80));
  console.info('Metric'.padEnd(20) + 'Expected'.padEnd(12) + 'Actual'.padEnd(12) + 'Diff'.padEnd(10) + 'Tolerance'.padEnd(12) + 'Status');
  console.info('-'.repeat(80));
  
  validationResults.forEach(result => {
    const row = result.metric.padEnd(20) + 
               result.expected.toString().padEnd(12) + 
               result.actual.toString().padEnd(12) + 
               result.diff.padEnd(10) + 
               result.tolerance.toString().padEnd(12) + 
               result.status;
    console.info(row);
  });
  
  console.info('-'.repeat(80));
  const passCount = validationResults.filter(r => r.passed).length;
  const totalCount = validationResults.length;
  console.info(`Summary: ${passCount}/${totalCount} metrics passed validation`);
  
  // Throw error with all failures if any exist
  if (failures.length > 0) {
    throw new Error(`\n🔍 SLEEP METRICS VALIDATION FAILURES (${failures.length}/${totalCount} failed):\n\n` + 
                   failures.join('\n\n') + 
                   `\n\n📊 Overall: ${passCount}/${totalCount} metrics passed validation`);
  }
}

/**
 * Validate metric value ranges
 */
function validateMetricRanges(day) {
  // Validate metric value ranges
  expect(day.SleepScore.value).toBeGreaterThanOrEqual(0);
  expect(day.SleepScore.value).toBeLessThanOrEqual(100);
  
  expect(day.TotalSleepDuration.value).toBeGreaterThanOrEqual(0);
  expect(day.TotalSleepDuration.value).toBeLessThanOrEqual(100);
  
  expect(day.SleepEfficiency.value).toBeGreaterThanOrEqual(0);
  expect(day.SleepEfficiency.value).toBeLessThanOrEqual(100);
  
  // Deep sleep can be very low but not negative
  expect(day.DeepSleep.value).toBeGreaterThanOrEqual(0);
  expect(day.DeepSleep.value).toBeLessThanOrEqual(100);
  
  expect(day.RemSleep.value).toBeGreaterThanOrEqual(0);
  expect(day.RemSleep.value).toBeLessThanOrEqual(100);
  
  // Sleep onset latency should be 100 if 0 minutes (instant sleep)
  expect(day.SleepOnsetLatency.value).toBeGreaterThanOrEqual(0);
  expect(day.SleepOnsetLatency.value).toBeLessThanOrEqual(100);
  
  // WASO can vary greatly
  expect(day.WASO.value).toBeGreaterThanOrEqual(0);
  expect(day.WASO.value).toBeLessThanOrEqual(100);
  
  // Heart rate dip
  expect(day.HRDip.value).toBeGreaterThanOrEqual(0);
  expect(day.HRDip.value).toBeLessThanOrEqual(100);
  
  // Sleep consistency
  expect(day.SleepConsistency.value).toBeGreaterThanOrEqual(0);
  expect(day.SleepConsistency.value).toBeLessThanOrEqual(100);
  
  // Circadian alignment can be low
  expect(day.CircadianAlignment.value).toBeGreaterThanOrEqual(0);
  expect(day.CircadianAlignment.value).toBeLessThanOrEqual(100);
  
  // Sleep cycles
  expect(day.SleepCycles.value).toBeGreaterThanOrEqual(0);
  expect(day.SleepCycles.value).toBeLessThanOrEqual(100);
  
  // Sleep stage distribution
  expect(day.SleepStageDistribution.value).toBeGreaterThanOrEqual(0);
  expect(day.SleepStageDistribution.value).toBeLessThanOrEqual(100);
  
  // Temperature deviation can be null
  if (day.TemperatureDeviation.value !== null) {
    expect(day.TemperatureDeviation.value).toBeGreaterThanOrEqual(0);
    expect(day.TemperatureDeviation.value).toBeLessThanOrEqual(100);
  }
}

/**
 * Validate trends and norm deviations
 */
function validateTrendsAndDeviations(day) {
  // Validate trends (0=down, 1=stable, 2=up)
  [0, 1, 2].forEach(validTrend => {
    if (day.SleepScore.trend !== null) {
      expect([0, 1, 2]).toContain(day.SleepScore.trend);
    }
  });
  
  // Validate normDeviation (0=below normal, 1=normal, 2=above normal)
  if (day.SleepScore.normDeviation !== null) {
    expect([0, 1, 2]).toContain(day.SleepScore.normDeviation);
  }
}

/**
 * Validate metrics consistency
 */
function validateMetricsConsistency(day) {
  const metrics = day.metrics;
  
  // Total sleep time should be sum of sleep stages
  const calculatedTotalSleep = 
    metrics.deepSleepHours + 
    metrics.remSleepHours + 
    metrics.lightSleepHours;
  
  // Allow for small floating point differences
  expect(Math.abs(calculatedTotalSleep - metrics.totalSleepTimeHours)).toBeLessThan(0.1);
  
  // Sleep efficiency should be reasonable
  const efficiency = (metrics.totalSleepTimeHours / metrics.timeInBedHours) * 100;
  expect(Math.abs(efficiency - day.SleepEfficiency.value)).toBeLessThan(10); // Allow 10% tolerance for calculation differences
  
  // Deep sleep percentage should match calculated value
  const deepSleepPercent = (metrics.deepSleepHours / metrics.totalSleepTimeHours) * 100;
  expect(Math.abs(deepSleepPercent - metrics.deepSleepPercent)).toBeLessThan(1);
  
  // REM sleep percentage should match calculated value  
  const remSleepPercent = (metrics.remSleepHours / metrics.totalSleepTimeHours) * 100;
  expect(Math.abs(remSleepPercent - metrics.remSleepPercent)).toBeLessThan(1);
}

/**
 * Test edge cases for sleep score function
 */
function testSleepScoreEdgeCases() {
  // Test scenario 3: Edge case - minimal sleep
  const minimalSleepData = {
    deepH: 0, deepM: 5,
    coreH: 3, coreM: 0,
    remH: 0, remM: 30,
    awakeH: 1, awakeM: 0,
    restingHR: 70, sleepHR: 65,
    fellAsleep: "02:00",
    tst: "4:35",
    observedCycles: 2,
    scsX: 1.5
  };

  console.info('Testing sleepScore with minimal sleep data:');
  expect(() => {
    sleepScore(minimalSleepData);
  }).not.toThrow();

  // Test scenario 4: Edge case - excessive sleep
  const excessiveSleepData = {
    deepH: 3, deepM: 0,
    coreH: 6, coreM: 30,
    remH: 2, remM: 30,
    awakeH: 0, awakeM: 30,
    restingHR: 60, sleepHR: 45,
    fellAsleep: "21:00",
    tst: "12:30",
    observedCycles: 7,
    scsX: 0.2
  };

  console.info('Testing sleepScore with excessive sleep data:');
  expect(() => {
    sleepScore(excessiveSleepData);
  }).not.toThrow();

  // Test scenario 5: Edge case - high heart rate variability
  const highHRVariabilityData = {
    deepH: 1, deepM: 30,
    coreH: 5, coreM: 0,
    remH: 1, remM: 30,
    awakeH: 0, awakeM: 15,
    restingHR: 50, sleepHR: 75, // Unusual - sleep HR higher than resting
    fellAsleep: "23:00",
    tst: "8:15",
    observedCycles: 5,
    scsX: 0.5
  };

  console.info('Testing sleepScore with high HR variability data:');
  expect(() => {
    sleepScore(highHRVariabilityData);
  }).not.toThrow();

  // Test scenario 6: Edge case - very late bedtime
  const lateBedtimeData = {
    deepH: 1, deepM: 15,
    coreH: 4, coreM: 45,
    remH: 1, remM: 45,
    awakeH: 0, awakeM: 15,
    restingHR: 65, sleepHR: 55,
    fellAsleep: "03:30", // Very late bedtime
    tst: "8:00",
    observedCycles: 4,
    scsX: 2.0 // High variability
  };

  console.info('Testing sleepScore with late bedtime data:');
  expect(() => {
    sleepScore(lateBedtimeData);
  }).not.toThrow();
}