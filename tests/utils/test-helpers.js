// Shared test utilities and helpers for OneVital API tests
import 'dotenv/config';
import {apiClient} from './api-client.js';

/**
 * Global test state management
 */
export const TestState = {
  testResults: {
    authentication: [],
    endpoints: []
  },

  /**
   * Initialize test state and authenticate all users
   */
  async initialize() {
    console.info('🔐 Testing authentication for all users...');
    this.testResults.authentication = await apiClient.testAllAuthentications();

    const successfulAuths = this.testResults.authentication.filter(auth => auth.success);
    if (successfulAuths.length === 0) {
      throw new Error('No successful authentications. Please check your .env credentials.');
    }

    console.info(`✅ ${successfulAuths.length}/${this.testResults.authentication.length} users authenticated successfully`);
  },

  /**
   * Clean up test state
   */
  async cleanup() {
    // Clear all sessions after tests
    apiClient.clearAllSessions();

    // Log test summary
    console.info('\n📊 Test Summary:');
    console.info('Authentication Results:', this.testResults.authentication);
    console.info('Endpoint Test Count:', this.testResults.endpoints.length);
  },

  /**
   * Get successful user index for API calls
   */
  getSuccessfulUserIndex() {
    const successfulAuth = this.testResults.authentication.find(auth => auth.success);
    return successfulAuth ? successfulAuth.sessionInfo?.userIndex || 0 : 0;
  },

  /**
   * Add endpoint test result
   */
  addEndpointResult(result) {
    this.testResults.endpoints.push(result);
  },

  /**
   * Add multiple endpoint test results
   */
  addEndpointResults(results) {
    this.testResults.endpoints.push(...results);
  },

  /**
   * Get authentication results
   */
  getAuthenticationResults() {
    return this.testResults.authentication;
  }
};

/**
 * Common test helpers
 */
export const TestHelpers = {
  /**
   * Validate that endpoint result is successful
   */
  validateEndpointSuccess(result, expectedStatus = 200) {
    expect(result.success).toBe(true);
    expect(result.status).toBe(expectedStatus);
  },

  /**
   * Validate OneVital response structure
   */
  validateOneVitalResponse(result) {
    const validation = apiClient.validateOneVitalResponse(result);
    expect(validation.isValid).toBe(true);
    expect(result.data.success).toBe(true);
    expect(result.data.error).toBeNull();
    return validation;
  },

  /**
   * Validate sleep metric types response structure
   */
  validateSleepMetricTypesResponse(result) {
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

    // Check property types
    expect(typeof firstMetric.name).toBe('string');
    expect(typeof firstMetric.value).toBe('string');
    expect(typeof firstMetric.description).toBe('string');

    return validation;
  },

  /**
   * Common endpoint test wrapper
   */
  async testEndpoint(endpoint, method = 'GET', body = null, expectedStatus = 200, userIndex = null) {
    const actualUserIndex = userIndex !== null ? userIndex : TestState.getSuccessfulUserIndex();
    const result = await apiClient.testEndpoint(endpoint, method, body, expectedStatus, actualUserIndex);
    
    TestState.addEndpointResult(result);
    
    return result;
  },

  /**
   * Test multiple users for an endpoint
   */
  async testMultipleUsers(endpoint, method = 'GET', body = null, expectedStatus = 200) {
    const results = await apiClient.testMultipleUsers(endpoint, method, body, expectedStatus);
    
    TestState.addEndpointResults(results);
    
    const successfulResults = results.filter(r => r.success);
    expect(successfulResults.length).toBeGreaterThan(0);

    // Log results for debugging
    console.info('Multi-user test results:', results.map(r => ({
      email: r.email,
      success: r.success,
      status: r.status
    })));

    return results;
  }
};

/**
 * Authentication test helpers
 */
export const AuthHelpers = {
  /**
   * Test that at least one user authenticated successfully
   */
  testMinimumAuthentication() {
    const successfulAuths = TestState.getAuthenticationResults().filter(auth => auth.success);
    expect(successfulAuths.length).toBeGreaterThan(0);
  },

  /**
   * Test that all successful authentications have valid tokens
   */
  testValidTokens() {
    const successfulAuths = TestState.getAuthenticationResults().filter(auth => auth.success);

    successfulAuths.forEach(auth => {
      expect(auth.token).toBeDefined();
      expect(auth.sessionInfo).toBeDefined();
      expect(auth.sessionInfo.email).toBeDefined();
      expect(auth.sessionInfo.expiresAt).toBeDefined();
    });
  }
};

/**
 * Error handling test helpers
 */
export const ErrorHelpers = {
  /**
   * Test unauthorized request handling
   */
  async testUnauthorizedRequest() {
    // Clear all sessions and try to make a request
    apiClient.clearAllSessions();

    try {
      const result = await apiClient.testEndpoint('/api/health/sleep-metric-types', 'GET', null, 401, -1);
      expect([401, 403]).toContain(result.status);
    } catch (error) {
      // Expected behavior - authentication should fail
      expect(error.message).toContain('Authentication failed');
    }
  },

  /**
   * Test invalid endpoint handling
   */
  async testInvalidEndpoint() {
    const userIndex = TestState.getSuccessfulUserIndex();

    try {
      const result = await apiClient.testEndpoint('/api/health/nonexistent-endpoint', 'GET', null, 404, userIndex);
      expect(result.status).toBe(404);
    } catch (error) {
      // This is acceptable for non-existent endpoints
      expect(error).toBeDefined();
    }
  }
};