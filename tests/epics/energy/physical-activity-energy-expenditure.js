/**
 * Physical Activity Energy Expenditure (PAEE) Calculation
 *
 * PAEE varies significantly based on lifestyle and fitness level. It includes both
 * structured exercise and non-exercise activity thermogenesis (NEAT).
 *
 * Formula: PAEE = MET value × AdjustedBMR/hour × duration (hours)
 * Where MET = AdjustedBMR or Input from wearable
 */

/**
 * Calculate Physical Activity Energy Expenditure using MET values and BMR
 * @param {number} metValue - Metabolic Equivalent of Task value
 * @param {number} adjustedBMR - Adjusted Basal Metabolic Rate (kcal/day)
 * @param {number} durationHours - Duration of activity in hours
 * @param {number} averageActivityLevel - Average activity level from wearable data (optional)
 * @returns {Object} PAEE with value, components, and calculation method
 */
export function calculatePhysicalActivityEnergyExpenditure(metValue, adjustedBMR, durationHours, averageActivityLevel = null) {
    let paeeValue;
    let calculationMethod;
    let activityBreakdown = null;

    // Convert BMR from per day to per hour
    const bmrPerHour = adjustedBMR / 24;

    // Check if we have wearable activity level data for enhanced calculation
    if (averageActivityLevel !== null && averageActivityLevel > 0) {
        // Enhanced calculation using wearable activity level
        // PAEE = (Activity Level × BMR/hour × duration) + (MET × BMR/hour × duration)
        const wearableComponent = averageActivityLevel * bmrPerHour * durationHours;
        const metComponent = metValue * bmrPerHour * durationHours;

        paeeValue = wearableComponent + metComponent;
        calculationMethod = 'enhanced_wearable_and_met';

        activityBreakdown = {
            wearableComponent: {
                activityLevel: averageActivityLevel,
                bmrPerHour: bmrPerHour,
                duration: durationHours,
                contribution: wearableComponent
            },
            metComponent: {
                metValue: metValue,
                bmrPerHour: bmrPerHour,
                duration: durationHours,
                contribution: metComponent
            }
        };
    } else {
        // Standard calculation using MET value only
        // PAEE = MET value × AdjustedBMR/hour × duration (hours)
        paeeValue = metValue * bmrPerHour * durationHours;
        calculationMethod = 'standard_met_based';
    }

    return {
        value: Math.round(paeeValue * 100) / 100, // Round to 2 decimal places
        adjustedBMR,
        bmrPerHour: Math.round(bmrPerHour * 100) / 100,
        calculationMethod,
        activityBreakdown,
        inputs: {
            metValue,
            adjustedBMR,
            durationHours,
            averageActivityLevel
        },
        trend: null // Not calculated in this implementation
    };
}

/**
 * Compare calculated PAEE with API result and provide analysis
 * @param {Object} calculatedPAEE - Our calculated PAEE
 * @param {Object} apiPAEE - API's PAEE
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function comparePhysicalActivityEnergyExpenditure(calculatedPAEE, apiPAEE, metrics) {
    if (!apiPAEE || apiPAEE.value === null) {
        return {
            available: false,
            message: 'API Physical Activity Energy Expenditure not available for comparison'
        };
    }

    const valueDiff = Math.abs(calculatedPAEE.value - apiPAEE.value);
    const isWithinRange = valueDiff <= 100; // Allow 100 kcal/day difference

    return {
        available: true,
        valueDiff,
        isWithinRange,
        calculatedPAEE,
        apiPAEE,
        metrics: {
            metValue: metrics.metValue,
            adjustedBMR: metrics.adjustedBMR,
            durationHours: metrics.durationHours,
            averageActivityLevel: metrics.averageActivityLevel,
            calculationMethod: calculatedPAEE.calculationMethod
        },
        message: isWithinRange ?
            '✅ Physical Activity Energy Expenditure calculation matches API within acceptable range' :
            `⚠️ Physical Activity Energy Expenditure calculation differs significantly from API (diff: ${valueDiff.toFixed(1)} kcal/day)`
    };
}
