/**
 * OneVital API Energy Endpoints Tests
 *
 * Tests for energy-related health endpoints.
 * Requires valid credentials in .env file.
 */

import 'dotenv/config';
import {TestState, TestHelpers} from '../utils/test-helpers.js';
import {getShortTestDateRange} from '../utils/date-helper.js';

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
      const { startDate, endDate } = getShortTestDateRange(7);

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
  });
});