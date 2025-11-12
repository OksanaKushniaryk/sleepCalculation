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
import {sleep} from "../../utils/async-helper.js";

export const mockThermicEffectFoodTest = async () => {
    await sleep(2000);
    
    console.log('\n=== Thermic Effect of Food (TEF) Test Cases ===\n');
    
    // Test Case 1: Simplified calculation method
    console.log('1. Simplified TEF Calculation (10% of total intake):');
    const simplifiedResult = calculateThermicEffectFood(2000);
    console.log('Input: 2000 kcal total intake');
    console.log('Result:', simplifiedResult);
    console.log('Expected TEF: ~200 kcal (10% of 2000)');
    console.log('Match:', simplifiedResult.value === 200 ? '✅' : '❌', '\n');
    
    // Test Case 2: Macronutrient-specific calculation
    console.log('2. Macronutrient-specific TEF Calculation:');
    const macroResult = calculateThermicEffectFood(2000, 800, 800, 400); // Protein: 800, Carb: 800, Fat: 400
    console.log('Input: 800 kcal protein, 800 kcal carbs, 400 kcal fat (2000 total)');
    console.log('Result:', macroResult);
    console.log('Expected TEF: ~290 kcal (800*0.25 + 800*0.075 + 400*0.025)');
    const expectedMacro = 800 * 0.25 + 800 * 0.075 + 400 * 0.025;
    console.log('Calculated Expected:', expectedMacro);
    console.log('Match:', Math.abs(macroResult.value - expectedMacro) < 0.01 ? '✅' : '❌', '\n');
    
    // Test Case 3: High protein diet
    console.log('3. High Protein Diet TEF:');
    const highProteinResult = calculateThermicEffectFood(2000, 1200, 400, 400); // 60% protein
    console.log('Input: 1200 kcal protein, 400 kcal carbs, 400 kcal fat');
    console.log('Result:', highProteinResult);
    const expectedHighProtein = 1200 * 0.25 + 400 * 0.075 + 400 * 0.025;
    console.log('Expected TEF:', expectedHighProtein, 'kcal');
    console.log('Match:', Math.abs(highProteinResult.value - expectedHighProtein) < 0.01 ? '✅' : '❌', '\n');
    
    // Test Case 4: High fat, low carb diet (keto-like)
    console.log('4. High Fat, Low Carb Diet TEF:');
    const ketoResult = calculateThermicEffectFood(2000, 600, 200, 1200); // Keto-like ratios
    console.log('Input: 600 kcal protein, 200 kcal carbs, 1200 kcal fat');
    console.log('Result:', ketoResult);
    const expectedKeto = 600 * 0.25 + 200 * 0.075 + 1200 * 0.025;
    console.log('Expected TEF:', expectedKeto, 'kcal');
    console.log('Match:', Math.abs(ketoResult.value - expectedKeto) < 0.01 ? '✅' : '❌', '\n');
    
    // Test Case 5: Zero calorie intake
    console.log('5. Zero Calorie Intake TEF:');
    const zeroResult = calculateThermicEffectFood(0);
    console.log('Input: 0 kcal total intake');
    console.log('Result:', zeroResult);
    console.log('Expected TEF: 0 kcal');
    console.log('Match:', zeroResult.value === 0 ? '✅' : '❌', '\n');
    
    // Test Case 6: Very low calorie intake (500 kcal)
    console.log('6. Very Low Calorie Intake TEF:');
    const lowCalResult = calculateThermicEffectFood(500);
    console.log('Input: 500 kcal total intake');
    console.log('Result:', lowCalResult);
    console.log('Expected TEF: 50 kcal (10% of 500)');
    console.log('Match:', lowCalResult.value === 50 ? '✅' : '❌', '\n');
    
    // Test Case 7: Very high calorie intake (4000 kcal)
    console.log('7. Very High Calorie Intake TEF:');
    const highCalResult = calculateThermicEffectFood(4000);
    console.log('Input: 4000 kcal total intake');
    console.log('Result:', highCalResult);
    console.log('Expected TEF: 400 kcal (10% of 4000)');
    console.log('Match:', highCalResult.value === 400 ? '✅' : '❌', '\n');
    
    // Test Case 8: Edge case - only protein intake
    console.log('8. Only Protein Intake TEF:');
    const proteinOnlyResult = calculateThermicEffectFood(1000, 1000, 0, 0);
    console.log('Input: 1000 kcal protein, 0 carbs, 0 fat');
    console.log('Result:', proteinOnlyResult);
    const expectedProteinOnly = 1000 * 0.25;
    console.log('Expected TEF:', expectedProteinOnly, 'kcal');
    console.log('Match:', Math.abs(proteinOnlyResult.value - expectedProteinOnly) < 0.01 ? '✅' : '❌', '\n');
    
    // Test Case 9: Edge case - only fat intake
    console.log('9. Only Fat Intake TEF:');
    const fatOnlyResult = calculateThermicEffectFood(1000, 0, 0, 1000);
    console.log('Input: 0 protein, 0 carbs, 1000 kcal fat');
    console.log('Result:', fatOnlyResult);
    const expectedFatOnly = 1000 * 0.025;
    console.log('Expected TEF:', expectedFatOnly, 'kcal');
    console.log('Match:', Math.abs(fatOnlyResult.value - expectedFatOnly) < 0.01 ? '✅' : '❌', '\n');
    
    // Test Case 10: Edge case - only carbohydrate intake
    console.log('10. Only Carbohydrate Intake TEF:');
    const carbOnlyResult = calculateThermicEffectFood(1000, 0, 1000, 0);
    console.log('Input: 0 protein, 1000 kcal carbs, 0 fat');
    console.log('Result:', carbOnlyResult);
    const expectedCarbOnly = 1000 * 0.075;
    console.log('Expected TEF:', expectedCarbOnly, 'kcal');
    console.log('Match:', Math.abs(carbOnlyResult.value - expectedCarbOnly) < 0.01 ? '✅' : '❌', '\n');
    
    // Test Case 11: Comparison between methods (same total calories)
    console.log('11. Method Comparison (2500 kcal):');
    const simplifiedMethod = calculateThermicEffectFood(2500);
    const macroMethod = calculateThermicEffectFood(2500, 625, 1250, 625); // 25% protein, 50% carb, 25% fat
    console.log('Simplified method result:', simplifiedMethod.value, 'kcal');
    console.log('Macronutrient method result:', macroMethod.value, 'kcal');
    const expectedMacroMethod = 625 * 0.25 + 1250 * 0.075 + 625 * 0.025;
    console.log('Expected macro method:', expectedMacroMethod, 'kcal');
    console.log('Difference between methods:', Math.abs(simplifiedMethod.value - macroMethod.value), 'kcal\n');
    
    // Test Case 12: Partial macronutrient data (should use simplified method)
    console.log('12. Partial Macronutrient Data (should use simplified):');
    const partialResult = calculateThermicEffectFood(2000, 800, null, 400); // Missing carb data
    console.log('Input: 800 kcal protein, null carbs, 400 kcal fat');
    console.log('Result:', partialResult);
    console.log('Method used:', partialResult.calculationMethod);
    console.log('Should use simplified method:', partialResult.calculationMethod === 'simplified_total_intake' ? '✅' : '❌', '\n');
    
    console.log('=== TEF Test Summary ===');
    console.log('All test cases completed. Review results above for accuracy verification.');
    
    return simplifiedResult;
};

mockThermicEffectFoodTest();

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