// Date helper for test configuration
import 'dotenv/config';

export class DateHelper {
  /**
   * Get test date range from environment variables or defaults
   * @returns {Object} Object with startDate and endDate in YYYY-MM-DD format
   */
  static getTestDateRange() {
    // Check for relative days configuration first
    const daysBack = process.env.TEST_DAYS_BACK;
    if (daysBack && !isNaN(daysBack)) {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(daysBack) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.info(`Using relative date range: ${daysBack} days back (${startDate} to ${endDate})`);
      return { startDate, endDate };
    }

    // Check for specific dates
    const envStartDate = process.env.TEST_START_DATE;
    const envEndDate = process.env.TEST_END_DATE;
    
    if (envStartDate && envEndDate) {
      // Validate date format
      if (this.isValidDateFormat(envStartDate) && this.isValidDateFormat(envEndDate)) {
        console.info(`Using configured date range: ${envStartDate} to ${envEndDate}`);
        return { 
          startDate: envStartDate, 
          endDate: envEndDate 
        };
      } else {
        console.warn('Invalid date format in environment variables. Expected YYYY-MM-DD format.');
      }
    }

    // Default fallback: last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.info(`Using default date range: last 30 days (${startDate} to ${endDate})`);
    return { startDate, endDate };
  }

  /**
   * Get test date range for shorter periods (e.g., 7 days for weekly tests)
   * @param {number} daysBack Number of days to go back from today
   * @returns {Object} Object with startDate and endDate in YYYY-MM-DD format
   */
  static getShortTestDateRange(daysBack = 7) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return { startDate, endDate };
  }

  /**
   * Validate date format (YYYY-MM-DD)
   * @param {string} dateString Date string to validate
   * @returns {boolean} True if valid format
   */
  static isValidDateFormat(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString().split('T')[0] === dateString;
  }

  /**
   * Get date range for specific test scenarios
   * @param {string} scenario Scenario type: 'monthly', 'weekly', 'yearly', 'custom'
   * @param {Object} options Additional options for custom scenarios
   * @returns {Object} Object with startDate and endDate
   */
  static getDateRangeForScenario(scenario, options = {}) {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    
    switch (scenario) {
      case 'weekly':
        return this.getShortTestDateRange(7);
      
      case 'monthly':
        return this.getShortTestDateRange(30);
      
      case 'quarterly':
        return this.getShortTestDateRange(90);
      
      case 'yearly':
        return this.getShortTestDateRange(365);
      
      case 'custom':
        if (options.startDate && options.endDate) {
          return {
            startDate: options.startDate,
            endDate: options.endDate
          };
        }
        break;
      
      default:
        return this.getTestDateRange();
    }
    
    return this.getTestDateRange();
  }
}

// Export singleton helper functions
export const getTestDateRange = () => DateHelper.getTestDateRange();
export const getShortTestDateRange = (daysBack) => DateHelper.getShortTestDateRange(daysBack);
export const getDateRangeForScenario = (scenario, options) => DateHelper.getDateRangeForScenario(scenario, options);