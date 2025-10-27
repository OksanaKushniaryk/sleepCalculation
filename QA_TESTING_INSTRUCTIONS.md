# QA Testing Instructions for Sleep Calculation Project

## Overview
This project tests sleep calculation algorithms and OneVital API endpoints. It includes comprehensive test suites for authentication, health endpoints, and sleep metric calculations.

## Prerequisites

### System Requirements
- **Node.js**: Version 16 or higher
- **npm**: Comes with Node.js
- **Operating System**: macOS, Windows, or Linux

### Account Requirements
- OneVital API credentials (email/password pairs)
- Access to OneVital development environment

## Setup Instructions

### 1. Environment Configuration
1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure credentials in `.env` file**:
   ```bash
   # API Base URL (usually pre-configured)
   ONEVITAL_API_BASE_URL=https://onevital-backend-dev.azurewebsites.net

   # User Credentials - REPLACE WITH ACTUAL CREDENTIALS
   USER_EMAIL=your-email1@domain.com,your-email2@domain.com,your-email3@domain.com
   USER_PASSWORD=password1,password2,password3

   # Test Configuration (optional)
   API_TEST_TIMEOUT=30000
   MAX_RETRY_ATTEMPTS=3
   ```

   ⚠️ **Important**: 
   - Replace example credentials with real OneVital account credentials
   - Use comma-separated values for multiple users
   - Ensure equal number of emails and passwords

### 2. Install Dependencies
```bash
npm install
```

## Running Tests

### Test Scripts Available

| Script | Command | Description |
|--------|---------|-------------|
| **test:api** | `npm run test:api` | Run API endpoint tests only |
| **test:report** | `npm run test:report` | Run all tests with HTML report generation |
| test | `npm run test` | Run all tests (basic) |
| test:unit | `npm run test:unit` | Run unit tests only |
| test:integration | `npm run test:integration` | Run integration tests only |
| test:coverage | `npm run test:coverage` | Run tests with coverage report |

### Primary Commands for QA

#### 1. API Testing
```bash
npm run test:api
```
**What it does**:
- Tests OneVital API authentication
- Validates health endpoints (sleep, stress, energy, activity)
- Compares API responses with sleep calculation functions
- Tests multiple user scenarios

**Expected Output**:
- Authentication success/failure for each user
- API endpoint response validation
- Sleep metric calculations comparison
- Test summary statistics

#### 2. Test Report Generation
```bash
npm run test:report
```
**What it does**:
- Runs all tests (same as test:api)
- Generates detailed HTML report in `reports/` folder
- Automatically opens report in browser (if not in CI mode)
- Creates coverage reports

**Report Location**: `./reports/index.html`

## Test Results and Reports

### Console Output
- ✅ **Green checkmarks**: Passing tests
- ❌ **Red X marks**: Failing tests
- 📊 **Summary tables**: Metric comparisons and validation results
- 🔍 **Debug information**: Detailed API responses and calculations

### HTML Reports
- **Location**: `./reports/index.html`
- **Features**: 
  - Test suite breakdown
  - Individual test results
  - Execution times
  - Error details with stack traces
  - Dark theme for easy reading

### Coverage Reports
- **Location**: `./coverage/index.html`
- **Shows**: Code coverage percentages for all JavaScript files

## Understanding Test Results

### Authentication Tests
- **Purpose**: Verify API credentials work correctly
- **Success criteria**: At least one user authenticates successfully
- **Common issues**: Invalid credentials, network connectivity

### API Endpoint Tests
Tests validate:
- **Response structure**: Correct JSON format
- **Status codes**: 200 for success, 401 for unauthorized
- **Data integrity**: Required fields present
- **Business logic**: Sleep calculations match expected values

### Sleep Metric Validation
Compares OneVital API responses with internal calculation functions:
- **Tolerance**: ±0.1 points for metric scores
- **Metrics tested**: Sleep duration, efficiency, deep sleep, REM sleep, etc.
- **Expected**: High correlation between API and calculations

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   ```
   Error: Authentication failed for user 0: 401
   ```
   **Solution**: Check credentials in `.env` file

2. **Network Timeouts**
   ```
   Error: Request timeout after 30000ms
   ```
   **Solution**: Check internet connection or increase timeout in `.env`

3. **Missing Environment File**
   ```
   Error: USER_EMAIL and USER_PASSWORD arrays must have the same length
   ```
   **Solution**: Ensure `.env` file exists and has matching email/password counts

4. **Node.js Version Issues**
   ```
   Error: node --experimental-vm-modules not supported
   ```
   **Solution**: Update to Node.js 16+ or use alternative test commands

### Debug Mode
For detailed debugging:
```bash
npm run test:debug
npm run test:api:debug
```

## File Structure
```
sleepCalculation/
├── tests/
│   ├── api/
│   │   └── endpoints.test.js     # Main API tests
│   ├── utils/
│   │   ├── api-client.js         # API wrapper
│   │   └── auth-helper.js        # Authentication logic
│   ├── fixtures/
│   │   └── test-data.js          # Test data
│   └── setup.js                  # Jest configuration
├── reports/                      # Generated HTML reports
├── coverage/                     # Coverage reports
├── .env                          # Your credentials (DO NOT COMMIT)
├── .env.example                  # Template file
├── jest.config.cjs               # Test configuration
└── package.json                  # Dependencies and scripts
```

## Best Practices for QA

1. **Run tests regularly**: Before major releases or API changes
2. **Check multiple users**: Ensure all configured users can authenticate
3. **Monitor test reports**: Review HTML reports for detailed analysis
4. **Validate new endpoints**: Update tests when new API endpoints are added
5. **Keep credentials secure**: Never commit `.env` file to version control

## Quick Start Guide

### **Prerequisites Setup**
1. Ensure Node.js 16+ is installed
2. Copy `.env.example` to `.env` 
3. **CRITICAL**: Replace example credentials with real OneVital API credentials in `.env`:
   ```
   USER_EMAIL=real-email1@domain.com,real-email2@domain.com
   USER_PASSWORD=real-password1,real-password2
   ```

### **Installation**
```bash
npm install
```

### **Primary Commands**

#### **For API Testing**
```bash
npm run test:api
```
- Tests OneVital API endpoints
- Validates authentication with configured users
- Compares sleep calculations with API responses

#### **For Detailed Reports**
```bash
npm run test:report
```
- Runs same tests as `test:api`
- Generates HTML report in `./reports/index.html`
- Opens report automatically in browser

### **What to Expect**
- **Success**: Green checkmarks with authentication confirmations
- **Reports**: HTML files in `reports/` folder with detailed test breakdowns
- **Validation**: Sleep metric comparisons between API and calculation functions
- **Multi-user**: Tests across all configured user accounts

### **Common Requirements**
- Valid OneVital API credentials
- Internet connectivity to development environment
- At least one successful user authentication for tests to proceed

The project uses Jest testing framework with custom API clients that handle authentication, endpoint testing, and metric validation automatically.