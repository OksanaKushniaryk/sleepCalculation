module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js',
    '**/*.(test|spec).js'
  ],
  
  // Reporters configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './reports',
      filename: 'index.html',
      pageTitle: 'Jest Test Report',
      inlineSource: true,
      darkTheme: true,
      openReport: process.env.CI ? false : true
    }]
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  collectCoverageFrom: [
    '*.js',
    '!sleep_aggregator.js', // Exclude main runner
    '!jest.config.js',
    '!coverage/**',
    '!node_modules/**',
    '!tests/**'
  ],
  
  // Coverage thresholds (disabled for initial setup)
  // coverageThreshold: {
  //   global: {
  //     branches: 90,
  //     functions: 90,
  //     lines: 90,
  //     statements: 90
  //   }
  // },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Transform configuration for ES6 modules
  transform: {},
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Verbose output
  verbose: true,
  
  // Show console logs
  silent: false,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Test timeout - 5 minutes for API tests
  testTimeout: 300000
};