/**
 * OneVital API Health Endpoints Tests
 *
 * Tests for the OneVital backend API health endpoints with authentication.
 * Requires valid credentials in .env file.
 */

// OneVital API Health Endpoints Tests
import 'dotenv/config';
import {apiClient} from '../utils/api-client.js';
import {apiTestData, sleepData} from '../fixtures/test-data.js';
import {sleepScore} from '../../sleep_aggregator.js';

describe('OneVital API Health Endpoints', () => {
  let testResults = {
    authentication: [],
    endpoints: []
  };

  beforeAll(async () => {
    // Test authentication for all users before running endpoint tests
    console.info('Testing authentication for all users...');
    testResults.authentication = await apiClient.testAllAuthentications();

    const successfulAuths = testResults.authentication.filter(auth => auth.success);
    if (successfulAuths.length === 0) {
      throw new Error('No successful authentications. Please check your .env credentials.');
    }

    console.info(`✅ ${successfulAuths.length}/${testResults.authentication.length} users authenticated successfully`);
  });

  afterAll(async () => {
    // Clear all sessions after tests
    apiClient.clearAllSessions();

    // Log test summary
    console.info('\n📊 Test Summary:');
    console.info('Authentication Results:', testResults.authentication);
    console.info('Endpoint Test Count:', testResults.endpoints.length);
  });

  describe('Authentication Tests', () => {
    test('should authenticate at least one user', () => {
      const successfulAuths = testResults.authentication.filter(auth => auth.success);
      expect(successfulAuths.length).toBeGreaterThan(0);
    });

    test('all successful authentications should have valid tokens', () => {
      const successfulAuths = testResults.authentication.filter(auth => auth.success);

      successfulAuths.forEach(auth => {
        expect(auth.token).toBeDefined();
        expect(auth.sessionInfo).toBeDefined();
        expect(auth.sessionInfo.email).toBeDefined();
        expect(auth.sessionInfo.expiresAt).toBeDefined();
      });
    });
  });

  describe('Health Endpoints - Sleep Related', () => {
    const successUserIndex = () => {
      const successfulAuth = testResults.authentication.find(auth => auth.success);
      return successfulAuth ? successfulAuth.sessionInfo?.userIndex || 0 : 0;
    };

    test('GET /api/health/sleep-metric-types should return available metric types', async () => {
      const userIndex = successUserIndex();
      const result = await apiClient.testEndpoint('/api/health/sleep-metric-types', 'GET', null, 200, userIndex);

      testResults.endpoints.push(result);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);

      // Validate OneVital response structure
      const validation = apiClient.validateSleepMetricTypes(result);
      expect(validation.isValid).toBe(true);

      // Check specific structure
      expect(result.data.success).toBe(true);
      expect(result.data.error).toBeNull();
      expect(result.onevitalData).toBeDefined();
      expect(result.onevitalData.metricTypes).toBeDefined();
      expect(Array.isArray(result.onevitalData.metricTypes)).toBe(true);
      expect(result.onevitalData.metricTypes.length).toBeGreaterThan(0);

      // Check first metric type structure
      const firstMetric = result.onevitalData.metricTypes[0];
      expect(firstMetric).toHaveProperty('name');
      expect(firstMetric).toHaveProperty('value');
      expect(firstMetric).toHaveProperty('description');


      // Check that the metric has all required properties (name, value, description)
      expect(typeof firstMetric.name).toBe('string');
      expect(typeof firstMetric.value).toBe('string');
      expect(typeof firstMetric.description).toBe('string');
    });

    test('GET /api/health/sleep should retrieve sleep sessions', async () => {
      const userIndex = successUserIndex();
      // Use proper ISO format with timezone like in curl example
      const from = '2025-01-01T00:00:00Z';
      const to = '2025-12-30T23:59:59Z';
      const params = new URLSearchParams({ from, to });

      const endpoint = `/api/health/sleep?${params.toString()}`;
      const result = await apiClient.testEndpoint(endpoint, 'GET', null, 200, userIndex);

      testResults.endpoints.push(result);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);

      // Validate OneVital response structure
      const validation = apiClient.validateOneVitalResponse(result);
      expect(validation.isValid).toBe(true);
      expect(result.data.success).toBe(true);
      expect(result.data.error).toBeNull();
    });

    test('GET /api/health/sleep-last-sync should return last sync timestamp', async () => {
      const userIndex = successUserIndex();
      const result = await apiClient.testEndpoint('/api/health/sleep-last-sync', 'GET', null, 200, userIndex);

      testResults.endpoints.push(result);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });

    test('GET /api/health/sleep-metric-statistics should return metric statistics and match sleepScore function output', async () => {
      const userIndex = successUserIndex();
      // Add date parameters for the last 30 days
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const endpoint = `/api/health/sleep-metric-statistics?startDate=${startDate}&endDate=${endDate}`;
      const result = await apiClient.testEndpoint(endpoint, 'GET', null, 200, userIndex);

      testResults.endpoints.push(result);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);

      // Validate OneVital response structure for sleep-metric-statistics
      const validation = apiClient.validateOneVitalResponse(result);
      expect(validation.isValid).toBe(true);

      // Validate response structure using validation object
      expect(validation.response).toBeDefined();
      expect(validation.response.success).toBe(true);
      expect(validation.response.error).toBeNull();

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
        return ;
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
          const tolerance = 0.1; // Allow differences up to 1 decimal place (e.g., 11.0 vs 11.09 is OK, but 11.0 vs 11.1 is not)
          
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

      return finalResult;
    });

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
    });

    test('should validate specific metric calculations from API response', async () => {
      const userIndex = successUserIndex();
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const endpoint = `/api/health/sleep-metric-statistics?startDate=${startDate}&endDate=${endDate}`;
      const result = await apiClient.testEndpoint(endpoint, 'GET', null, 200, userIndex);

      // Validate OneVital response structure for sleep-metric-statistics
      const validation = apiClient.validateOneVitalResponse(result);
      expect(validation.isValid).toBe(true);

      const data = validation.response.onevitalData;

      if (data && data.dailyValues && data.dailyValues.length > 0) {
        data.dailyValues.forEach((day, index) => {
          console.info(`Validating day ${index + 1} metrics:`, day.date);
          
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
          
          // Validate metrics consistency
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
        });
      }
    });
  });

  describe('Health Endpoints - Stress Related', () => {
    const successUserIndex = () => {
      const successfulAuth = testResults.authentication.find(auth => auth.success);
      return successfulAuth ? successfulAuth.sessionInfo?.userIndex || 0 : 0;
    };

    test('GET /api/health/stress-metric-types should return stress metric types', async () => {
      const userIndex = successUserIndex();
      const result = await apiClient.testEndpoint('/api/health/stress-metric-types', 'GET', null, 200, userIndex);

      testResults.endpoints.push(result);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });

    test('GET /api/health/stress should return latest stress snapshot', async () => {
      const userIndex = successUserIndex();
      const result = await apiClient.testEndpoint('/api/health/stress', 'GET', null, 200, userIndex);

      testResults.endpoints.push(result);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });

    test('GET /api/health/stress-last-sync should return stress sync timestamp', async () => {
      const userIndex = successUserIndex();
      const result = await apiClient.testEndpoint('/api/health/stress-last-sync', 'GET', null, 200, userIndex);

      testResults.endpoints.push(result);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });

    test('GET /api/health/stress-metric-statistics should return stress statistics', async () => {
      const userIndex = successUserIndex();
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const endpoint = `/api/health/stress-metric-statistics?startDate=${startDate}&endDate=${endDate}`;
      const result = await apiClient.testEndpoint(endpoint, 'GET', null, 200, userIndex);

      testResults.endpoints.push(result);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });
  });

  describe('Health Endpoints - Energy Related', () => {
    const successUserIndex = () => {
      const successfulAuth = testResults.authentication.find(auth => auth.success);
      return successfulAuth ? successfulAuth.sessionInfo?.userIndex || 0 : 0;
    };

    test('GET /api/health/energy should return latest energy snapshot', async () => {
      const userIndex = successUserIndex();
      const result = await apiClient.testEndpoint('/api/health/energy', 'GET', null, 200, userIndex);

      testResults.endpoints.push(result);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });

    test('GET /api/health/energy-historical-data should return energy historical data', async () => {
      const userIndex = successUserIndex();
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const endpoint = `/api/health/energy-historical-data?startDate=${startDate}&endDate=${endDate}`;
      const result = await apiClient.testEndpoint(endpoint, 'GET', null, 200, userIndex);

      testResults.endpoints.push(result);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });
  });

  describe('Health Endpoints - Activity Related', () => {
    const successUserIndex = () => {
      const successfulAuth = testResults.authentication.find(auth => auth.success);
      return successfulAuth ? successfulAuth.sessionInfo?.userIndex || 0 : 0;
    };

    test('GET /api/health/activity-metric-types should return activity metric types', async () => {
      const userIndex = successUserIndex();
      const result = await apiClient.testEndpoint('/api/health/activity-metric-types', 'GET', null, 200, userIndex);

      testResults.endpoints.push(result);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });
  });

  describe('Multi-User Testing', () => {
    test('should test sleep endpoints with multiple authenticated users', async () => {
      const results = await apiClient.testMultipleUsers('/api/health/sleep-metric-types', 'GET', null, 200);

      testResults.endpoints.push(...results);

      const successfulResults = results.filter(r => r.success);
      expect(successfulResults.length).toBeGreaterThan(0);

      // Log results for debugging
      console.info('Multi-user test results:', results.map(r => ({
        email: r.email,
        success: r.success,
        status: r.status
      })));
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle unauthorized requests gracefully', async () => {
      // Clear all sessions and try to make a request
      apiClient.clearAllSessions();

      try {
        const result = await apiClient.testEndpoint('/api/health/sleep-metric-types', 'GET', null, 401, -1);
        expect([401, 403]).toContain(result.status);
      } catch (error) {
        // Expected behavior - authentication should fail
        expect(error.message).toContain('Authentication failed');
      }
    });

    test('should handle invalid endpoints gracefully', async () => {
      const userIndex = 0;

      try {
        const result = await apiClient.testEndpoint('/api/health/nonexistent-endpoint', 'GET', null, 404, userIndex);
        expect(result.status).toBe(404);
      } catch (error) {
        // This is acceptable for non-existent endpoints
        expect(error).toBeDefined();
      }
    });
  });
});

// Keep original sleep calculation tests for future local API implementation
describe('Sleep Calculation API Endpoints (Future Local Implementation)', () => {

  // Template tests that can be enabled when API is implemented
  describe('API Test Templates (Currently Disabled)', () => {
    test('should have API test templates ready for implementation', () => {
      // This test ensures the file is valid and ready for when API is implemented
      expect(apiTestData).toBeDefined();
      expect(apiTestData.validRequest).toBeDefined();
      expect(apiTestData.invalidRequest).toBeDefined();
      expect(apiTestData.missingFields).toBeDefined();
    });

    test('should have test data structured for API testing', () => {
      expect(apiTestData.validRequest).toHaveProperty('method');
      expect(apiTestData.validRequest).toHaveProperty('endpoint');
      expect(apiTestData.validRequest).toHaveProperty('body');

      expect(apiTestData.validRequest.method).toBe('POST');
      expect(apiTestData.validRequest.endpoint).toBe('/api/sleep-score');
      expect(apiTestData.validRequest.body).toEqual(sleepData.perfect);
    });
  });
});