/**
 * Total Energy Expenditure (TEE) Calculation
 *
 * TEE represents the total amount of energy a person uses in a day. It is a sum of:
 * - TEF (Thermic Effect of Food): Energy used for digesting, absorbing, and metabolizing food
 * - PAEE (Physical Activity Energy Expenditure): Energy expended through physical activity
 * - Stress energy: Additional energy cost from stress response
 */

/**
 * Calculate Total Energy Expenditure
 * @param {number} tef - Thermic Effect of Food in kcal
 * @param {number} paee - Physical Activity Energy Expenditure in kcal
 * @param {number} stressEnergy - Additional energy from stress in kcal
 * @param {number} sleepScore - Sleep score from 0 to 100 (affects efficiency)
 * @param {number} stressScore - Stress score from 0 to 100
 * @param {number} timeOfDay - Hour of day (0 to 23)
 * @returns {Object} TEE with value, components, and adjustments
 */
export function calculateTotalEnergyExpenditure(tef, paee, stressEnergy, sleepScore = 90, stressScore = 50, timeOfDay = 12) {
    // Base TEE calculation
    const baseTEE = tef + paee + stressEnergy;

    // Calculate adjustment factors

    // Sleep Efficiency Factor: Better sleep = more efficient energy usage
    const sleepEfficiencyFactor = 0.95 + 0.05 * (sleepScore / 100);

    // Stress Impact Factor: Higher stress = increased energy expenditure
    const stressImpactFactor = 1.00 + 0.10 * (stressScore / 100);

    // Time-of-Day Activity Factor: Energy expenditure varies throughout the day
    const timeActivityFactor = 1.00 + 0.15 * Math.sin((2 * Math.PI / 24) * (timeOfDay - 14));

    // Total Adjusted TEE: AdjustedTEE = TEE × F_sleep × F_stress × F_time
    const adjustedTEE = baseTEE * sleepEfficiencyFactor * stressImpactFactor * timeActivityFactor;

    return {
        value: Math.round(adjustedTEE * 100) / 100, // Round to 2 decimal places
        baseTEE: Math.round(baseTEE * 100) / 100,
        components: {
            tef: Math.round(tef * 100) / 100,
            paee: Math.round(paee * 100) / 100,
            stressEnergy: Math.round(stressEnergy * 100) / 100
        },
        adjustmentFactors: {
            sleepEfficiency: Math.round(sleepEfficiencyFactor * 1000) / 1000, // Round to 3 decimal places
            stressImpact: Math.round(stressImpactFactor * 1000) / 1000,
            timeActivity: Math.round(timeActivityFactor * 1000) / 1000
        },
        inputs: {
            tef,
            paee,
            stressEnergy,
            sleepScore,
            stressScore,
            timeOfDay
        },
        trend: null // Not calculated in this implementation
    };
}

/**
 * Compare calculated TEE with API result and provide analysis
 * @param {Object} calculatedTEE - Our calculated TEE
 * @param {Object} apiTEE - API's TEE
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareTotalEnergyExpenditures(calculatedTEE, apiTEE, metrics) {
    if (!apiTEE || apiTEE.value === null) {
        return {
            available: false,
            message: 'API Total Energy Expenditure not available for comparison'
        };
    }

    const valueDiff = Math.abs(calculatedTEE.value - apiTEE.value);
    const isWithinRange = valueDiff <= 100; // Allow 100 kcal/day difference

    return {
        available: true,
        valueDiff,
        isWithinRange,
        calculatedTEE,
        apiTEE,
        metrics: {
            tef: metrics.tef,
            paee: metrics.paee,
            stressEnergy: metrics.stressEnergy,
            sleepScore: metrics.sleepScore,
            stressScore: metrics.stressScore,
            timeOfDay: metrics.timeOfDay
        },
        message: isWithinRange ?
            '✅ Total Energy Expenditure calculation matches API within acceptable range' :
            `⚠️ Total Energy Expenditure calculation differs significantly from API (diff: ${valueDiff.toFixed(1)} kcal/day)`
    };
}