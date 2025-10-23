/**
 * OneVital API Activity Endpoints Tests
 *
 * Tests for activity-related health endpoints.
 * Requires valid credentials in .env file.
 */

import 'dotenv/config';
import {TestState, TestHelpers} from '../utils/test-helpers.js';

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
});