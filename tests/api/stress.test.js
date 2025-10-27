/**
 * OneVital API Stress Endpoints Tests
 *
 * Tests for stress-related health endpoints.
 * Requires valid credentials in .env file.
 */

import 'dotenv/config';
import {TestState, TestHelpers} from '../utils/test-helpers.js';
import {getTestDateRange} from '../utils/date-helper.js';

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
    test('GET /api/health/stress-historical-data should return stress statistics', async () => {
      // Use configurable date range from environment or defaults to last 30 days
      const { startDate, endDate } = getTestDateRange();

      const endpoint = `/api/health/stress-historical-data?from=${startDate}&to=${endDate}`;
      const result = await TestHelpers.testEndpoint(endpoint, 'GET', null, 200);
      TestHelpers.validateEndpointSuccess(result);

      // If we have data, validate the structure
      if (result.data && result.data.success && result.onevitalData) {
        console.info('Stress statistics data received successfully');
        
        // Log basic info about the response
        const data = result.onevitalData;
        if (data.dailyValues && Array.isArray(data.dailyValues)) {
          console.info(`Found ${data.dailyValues.length} days of stress data`);
        }
      }
    });
  });
});