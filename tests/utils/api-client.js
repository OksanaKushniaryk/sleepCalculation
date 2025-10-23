// OneVital API Client wrapper for testing
import { authHelper } from './auth-helper.js';

class OneVitalAPIClient {
  constructor() {
    this.baseUrl = process.env.ONEVITAL_API_BASE_URL || 'https://onevital-backend-dev.azurewebsites.net';
    this.timeout = parseInt(process.env.API_TEST_TIMEOUT) || 30000;
  }

  // Health Endpoints
  async getHealth(userIndex = 0) {
    return this.makeRequest('/api/health', 'GET', null, userIndex);
  }

  async getHealthCheck(userIndex = 0) {
    return this.makeRequest('/api/health/check', 'GET', null, userIndex);
  }

  async getHealthStatus(userIndex = 0) {
    return this.makeRequest('/api/health/status', 'GET', null, userIndex);
  }

  async getHealthDetailed(userIndex = 0) {
    return this.makeRequest('/api/health/detailed', 'GET', null, userIndex);
  }

  // Generic request method with authentication
  async makeRequest(endpoint, method = 'GET', body = null, userIndex = 0) {
    // Get Bearer token for authorization
    const token = await authHelper.login(userIndex);
    
    const options = {
      method,
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      signal: AbortSignal.timeout(this.timeout)
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    // Construct full URL
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, options);
      
      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      };

      // Try to parse JSON response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const jsonData = await response.json();
          result.data = jsonData;
          
          // Extract nested data for OneVital API structure
          if (jsonData.success && jsonData.data) {
            result.onevitalData = jsonData.data;
            result.success = jsonData.success;
            result.error = jsonData.error;
          }
        } catch (e) {
          result.text = await response.text();
        }
      } else {
        result.text = await response.text();
      }

      return result;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new Error(`Request timeout after ${this.timeout}ms for ${endpoint}`);
      }
      throw error;
    }
  }

  // Test helper methods
  async testEndpoint(endpoint, method = 'GET', body = null, expectedStatus = 200, userIndex = 0) {
    const result = await this.makeRequest(endpoint, method, body, userIndex);
    
    return {
      ...result,
      success: result.status === expectedStatus,
      endpoint,
      method,
      userIndex,
      sessionInfo: authHelper.getSessionInfo(userIndex)
    };
  }

  async testMultipleUsers(endpoint, method = 'GET', body = null, expectedStatus = 200) {
    const credentials = authHelper.getAllCredentials();
    const results = [];

    for (const credential of credentials) {
      try {
        const result = await this.testEndpoint(endpoint, method, body, expectedStatus, credential.index);
        results.push({
          userIndex: credential.index,
          email: credential.email,
          ...result
        });
      } catch (error) {
        results.push({
          userIndex: credential.index,
          email: credential.email,
          error: error.message,
          success: false
        });
      }
    }

    return results;
  }

  // Authentication test helpers
  async testAuthentication(userIndex = 0) {
    try {
      const token = await authHelper.login(userIndex);
      const sessionInfo = authHelper.getSessionInfo(userIndex);
      
      return {
        success: true,
        token: token.substring(0, 20) + '...', // Truncated for security
        sessionInfo: {
          email: sessionInfo.email,
          expiresAt: new Date(sessionInfo.expiresAt).toISOString(),
          userIndex: sessionInfo.userIndex
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        userIndex
      };
    }
  }

  async testAllAuthentications() {
    const credentials = authHelper.getAllCredentials();
    const results = [];

    for (const credential of credentials) {
      const authResult = await this.testAuthentication(credential.index);
      results.push({
        ...authResult,
        email: credential.email
      });
    }

    return results;
  }

  // Utility methods
  getBaseUrl() {
    return this.baseUrl;
  }

  setTimeout(timeout) {
    this.timeout = timeout;
  }

  clearAllSessions() {
    authHelper.clearAllSessions();
  }

  getCredentialsInfo() {
    return authHelper.getAllCredentials();
  }

  // Response validation helpers
  validateHealthResponse(response) {
    const validations = {
      hasStatus: typeof response.status === 'number',
      isOk: response.ok === true,
      hasData: response.data !== undefined || response.text !== undefined,
      hasHeaders: response.headers && typeof response.headers === 'object'
    };

    return {
      isValid: Object.values(validations).every(v => v),
      validations,
      response
    };
  }

  validateJsonResponse(response, requiredFields = []) {
    const validation = this.validateHealthResponse(response);
    
    if (response.data) {
      const dataValidations = {};
      
      for (const field of requiredFields) {
        dataValidations[`has_${field}`] = response.data.hasOwnProperty(field);
      }
      
      validation.validations = { ...validation.validations, ...dataValidations };
      validation.isValid = Object.values(validation.validations).every(v => v);
    }

    return validation;
  }

  // OneVital-specific validation helpers
  validateOneVitalResponse(response) {
    const validations = {
      hasStatus: typeof response.status === 'number',
      isOk: response.ok === true,
      hasData: response.data !== undefined,
      hasHeaders: response.headers && typeof response.headers === 'object'
    };

    // Check OneVital-specific structure
    if (response.data) {
      validations.hasSuccessField = response.data.hasOwnProperty('success');
      validations.hasDataField = response.data.hasOwnProperty('data');
      validations.hasErrorField = response.data.hasOwnProperty('error');
      validations.isSuccessful = response.data.success === true;
      validations.noError = response.data.error === null;
    }

    return {
      isValid: Object.values(validations).every(v => v),
      validations,
      response
    };
  }

  validateOneVitalData(response, requiredDataFields = []) {
    const validation = this.validateOneVitalResponse(response);
    
    // Check nested data fields
    if (response.onevitalData) {
      const dataValidations = {};
      
      for (const field of requiredDataFields) {
        dataValidations[`has_${field}`] = response.onevitalData.hasOwnProperty(field);
      }
      
      validation.validations = { ...validation.validations, ...dataValidations };
      validation.isValid = Object.values(validation.validations).every(v => v);
    }

    return validation;
  }

  // Sleep metric types specific validation
  validateSleepMetricTypes(response) {
    const validation = this.validateOneVitalData(response, ['metricTypes']);
    
    if (response.onevitalData && response.onevitalData.metricTypes) {
      const metricTypes = response.onevitalData.metricTypes;
      
      validation.validations.isArray = Array.isArray(metricTypes);
      validation.validations.hasMetrics = metricTypes.length > 0;
      
      // Check metric structure
      if (metricTypes.length > 0) {
        const firstMetric = metricTypes[0];
        validation.validations.hasName = firstMetric.hasOwnProperty('name');
        validation.validations.hasValue = firstMetric.hasOwnProperty('value');
        validation.validations.hasDescription = firstMetric.hasOwnProperty('description');
      }
      
      validation.isValid = Object.values(validation.validations).every(v => v);
    }

    return validation;
  }
}

// Export singleton instance
export const apiClient = new OneVitalAPIClient();

// Export class for testing
export { OneVitalAPIClient };