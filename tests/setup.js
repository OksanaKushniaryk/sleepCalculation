// Jest setup file
// Global test configuration and utilities

// Load environment variables for API testing
import 'dotenv/config';

// Extend Jest matchers for better assertions
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toBeValidScore(received) {
    const pass = typeof received === 'number' && received >= 0 && received <= 100;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid score (0-100)`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid score (0-100)`,
        pass: false,
      };
    }
  }
});

// Mock console.log for cleaner test output
global.console = {
  ...console,
  log: () => {},
  table: () => {},
  // log: console.log,

  // Keep native behaviour for other methods, use those to print out things in your own tests, not `console.log`
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};