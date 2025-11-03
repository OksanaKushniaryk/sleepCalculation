# OneVital API Tests

This directory contains modular test files for the OneVital API endpoints, organized by functionality for better maintainability and targeted testing.

## Test File Organization

### Core Test Files

| File | Description | Key Features |
|------|-------------|--------------|
| `auth.test.js` | Authentication tests | User login, token validation, session management |
| `sleep.test.js` | Sleep endpoint tests | Sleep metrics, score validation, comprehensive sleep data testing |
| `stress.test.js` | Stress endpoint tests | Stress metrics and statistics |
| `energy.test.js` | Energy endpoint tests | Energy snapshots and historical data |
| `activity.test.js` | Activity endpoint tests | Activity metric types |
| `error-handling.test.js` | Error scenarios and multi-user tests | Edge cases, concurrent requests, error validation |
| `local-implementation.test.js` | Future local API tests | Template tests for when local API is implemented |

### Utility Files

| File | Description |
|------|-------------|
| `../utils/test-helpers.js` | Shared test utilities, state management, and helper functions |
| `../utils/date-helper.js` | Date configuration and management for tests |
| `../utils/api-client.js` | API client wrapper for OneVital endpoints |

## Running Tests

### Run All API Tests
```bash
npm run test:api
npm run test:report  # With HTML report generation
```

### Run Specific Test Categories
```bash
npm run test:api:auth      # Authentication tests only
npm run test:api:sleep     # Sleep endpoint tests only
npm run test:api:stress    # Stress endpoint tests only
npm run test:api:energy    # Energy endpoint tests only
npm run test:api:activity  # Activity endpoint tests only
npm run test:api:errors    # Error handling and multi-user tests
npm run test:api:local     # Future local implementation tests
```

### Debug Mode
```bash
npm run test:api:debug     # Debug all API tests
```

## Test Configuration

### Environment Variables
Configure test behavior via `.env` file:

```bash
# API Configuration
ONEVITAL_API_BASE_URL=https://onevital-backend-dev.azurewebsites.net
USER_EMAIL=email1@domain.com,email2@domain.com
USER_PASSWORD=password1,password2

# Test Date Range Configuration
TEST_START_DATE=2025-01-01
TEST_END_DATE=2025-12-30
# OR use relative days (overrides specific dates)
TEST_DAYS_BACK=30

# Test Configuration
API_TEST_TIMEOUT=30000
MAX_RETRY_ATTEMPTS=3
```

## Test Features

### Shared State Management
- **TestState**: Global test state for authentication results and endpoint tracking
- **Automatic Authentication**: All tests authenticate users before running
- **Session Management**: Proper cleanup and session handling

### Helper Functions
- **TestHelpers**: Common test operations and validations
- **AuthHelpers**: Authentication-specific test utilities
- **ErrorHelpers**: Error scenario testing utilities

### Date Configuration
- **Flexible Date Ranges**: Configure via environment variables
- **Default Fallbacks**: Automatic fallback to sensible defaults
- **Multiple Scenarios**: Support for different date range testing needs

### Comprehensive Validation
- **Response Structure**: Validates OneVital API response formats
- **Data Integrity**: Checks metric calculations and consistency
- **Sleep Score Validation**: Compares API responses with local sleep calculation functions
- **Edge Case Testing**: Handles various error scenarios and edge cases

## Test Dependencies

### Required Files
- `../utils/api-client.js` - API client implementation
- `../fixtures/test-data.js` - Test data and fixtures
- `../epics/sleep_aggregator.js` - Sleep calculation functions
- `.env` - Environment configuration with valid OneVital credentials

### Authentication Requirements
Tests require valid OneVital API credentials configured in the `.env` file. At least one successful authentication is required for tests to proceed.

## Benefits of Modular Structure

### Maintainability
- **Focused Testing**: Each file contains tests for specific functionality
- **Easier Debugging**: Run only the tests relevant to your changes
- **Clear Organization**: Easy to find and modify specific test scenarios

### Development Workflow
- **Targeted Testing**: Test only the endpoints you're working on
- **Faster Feedback**: Run subset of tests during development
- **Parallel Development**: Multiple developers can work on different test files

### QA Benefits
- **Granular Control**: Run specific test categories as needed
- **Clear Reporting**: Test results organized by functionality
- **Easy Troubleshooting**: Quickly identify which endpoint category is failing

## Migration Notes

The original `endpoints.test.js` file has been split into these modular files. The backup is available as `endpoints.test.js.backup` if needed for reference.

All existing functionality has been preserved and enhanced with better organization and additional test scenarios.