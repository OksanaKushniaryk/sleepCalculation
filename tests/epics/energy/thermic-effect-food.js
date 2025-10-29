/**
 * Thermic Effect of Food (TEF) Calculation
 * 
 * TEF represents the energy required to digest, absorb, and metabolize food.
 * It generally accounts for ~10% of Total Energy Expenditure (TEE).
 */

/**
 * Calculate Thermic Effect of Food using macronutrient-specific or simplified approach
 * @param {number} totalCalorieIntake - Total daily caloric intake
 * @param {number} proteinKcal - Protein calories (optional for precise calculation)
 * @param {number} carbKcal - Carbohydrate calories (optional for precise calculation)
 * @param {number} fatKcal - Fat calories (optional for precise calculation)
 * @returns {Object} TEF with value, breakdown, and calculation method
 */
export function calculateThermicEffectFood(totalCalorieIntake, proteinKcal = null, carbKcal = null, fatKcal = null) {
    let tefValue;
    let calculationMethod;
    let macronutrientBreakdown = null;
    
    // Check if we have detailed macronutrient data for precise calculation
    if (proteinKcal !== null && carbKcal !== null && fatKcal !== null) {
        // Precise calculation using macronutrient-specific TEF rates
        // TEF = (0.25 * Protein_kcal) + (0.075 * Carb_kcal) + (0.025 * Fat_kcal)
        const proteinTEF = 0.25 * proteinKcal;    // Protein: 20-30% (using 25%)
        const carbTEF = 0.075 * carbKcal;         // Carbohydrates: 5-10% (using 7.5%)
        const fatTEF = 0.025 * fatKcal;           // Fats: 0-3% (using 2.5%)
        
        tefValue = proteinTEF + carbTEF + fatTEF;
        calculationMethod = 'macronutrient_specific';
        
        macronutrientBreakdown = {
            protein: {
                calories: proteinKcal,
                tefRate: 0.25,
                tefContribution: proteinTEF
            },
            carbohydrates: {
                calories: carbKcal,
                tefRate: 0.075,
                tefContribution: carbTEF
            },
            fats: {
                calories: fatKcal,
                tefRate: 0.025,
                tefContribution: fatTEF
            }
        };
    } else {
        // Simplified calculation using total caloric intake
        // TEF = 0.1 * Total Caloric Intake
        tefValue = 0.1 * totalCalorieIntake;
        calculationMethod = 'simplified_total_intake';
    }
    
    return {
        value: Math.round(tefValue * 100) / 100, // Round to 2 decimal places
        totalCalorieIntake,
        calculationMethod,
        macronutrientBreakdown,
        inputs: {
            totalCalorieIntake,
            proteinKcal,
            carbKcal,
            fatKcal
        },
        trend: null // Not calculated in this implementation
    };
}

/**
 * Compare calculated TEF with API result and provide analysis
 * @param {Object} calculatedTEF - Our calculated TEF
 * @param {Object} apiTEF - API's TEF
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareThermicEffectFood(calculatedTEF, apiTEF, metrics) {
    if (!apiTEF || apiTEF.value === null) {
        return {
            available: false,
            message: 'API Thermic Effect of Food not available for comparison'
        };
    }

    const valueDiff = Math.abs(calculatedTEF.value - apiTEF.value);
    const isWithinRange = valueDiff <= 25; // Allow 25 kcal/day difference

    return {
        available: true,
        valueDiff,
        isWithinRange,
        calculatedTEF,
        apiTEF,
        metrics: {
            totalCalorieIntake: metrics.totalCalorieIntake,
            proteinKcal: metrics.proteinKcal,
            carbKcal: metrics.carbKcal,
            fatKcal: metrics.fatKcal,
            calculationMethod: calculatedTEF.calculationMethod
        },
        message: isWithinRange ? 
            '✅ Thermic Effect of Food calculation matches API within acceptable range' :
            `⚠️ Thermic Effect of Food calculation differs significantly from API (diff: ${valueDiff.toFixed(1)} kcal/day)`
    };
}