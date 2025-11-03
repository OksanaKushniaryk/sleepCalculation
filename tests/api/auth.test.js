/**
 * OneVital API Authentication Tests
 *
 * Tests for user authentication and session management.
 * Requires valid credentials in .env file.
 */

import 'dotenv/config';
import {TestState, AuthHelpers} from '../utils/test-helpers.js';

describe('OneVital API Authentication', () => {
  beforeAll(async () => {
    await TestState.initialize();
  });

  afterAll(async () => {
    await TestState.cleanup();
  });

  describe('User Authentication', () => {
    test('should authenticate at least one user', () => {
      AuthHelpers.testMinimumAuthentication();
    });

    test('all successful authentications should have valid tokens', () => {
      AuthHelpers.testValidTokens();
    });

    test('should handle multiple user credentials', () => {
      const authResults = TestState.getAuthenticationResults();
      expect(authResults.length).toBeGreaterThan(0);
      
      // Log authentication status for each user
      authResults.forEach((auth, index) => {
        console.info(`User ${index + 1} (${auth.email}): ${auth.success ? '✅ Success' : '❌ Failed'}`);
        if (!auth.success && auth.error) {
          console.warn(`  Error: ${auth.error}`);
        }
      });
    });

    test('should provide session information for successful authentications', () => {
      const successfulAuths = TestState.getAuthenticationResults().filter(auth => auth.success);
      
      successfulAuths.forEach(auth => {
        expect(auth.sessionInfo).toBeDefined();
        expect(auth.sessionInfo.email).toBeDefined();
        expect(auth.sessionInfo.expiresAt).toBeDefined();
        expect(auth.sessionInfo.userIndex).toBeDefined();
        
        // Validate expiration time is in the future
        const expiresAt = new Date(auth.sessionInfo.expiresAt);
        const now = new Date();
        expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
      });
    });
  });
});