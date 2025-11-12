/**
 * Energy Credit Score Calculation
 * 
 * Energy Credit Score is calculated in two parts:
 * 1. Daily Update: ΔCreditScore based on EnergyDelta (EnergyCapacity - TEE)
 * 2. Total Energy Credit Score: Using sigmoid function with current score and rolling average
 * 
 * Formulas:
 * - EnergyDelta = EnergyCapacity - TEE
 * - scaled_EnergyDelta = EnergyDelta / MaxScalingDelta
 * - If EnergyDelta > 0: ΔCreditScore = +S × tanh(scaled_EnergyDelta)
 * - If EnergyDelta < 0: ΔCreditScore = -D × tanh(|scaled_EnergyDelta|)
 * - TotalEnergyCreditScore = MaxCreditScore × sigmoid(CurrentScore + RollingAVG of ΔCreditScores)
 */

/**
 * Calculate daily Energy Credit Score update (ΔCreditScore)
 * @param {number} energyCapacity - Energy Capacity (kcal/day)
 * @param {number} totalEnergyExpenditure - Total Energy Expenditure (TEE) (kcal/day)
 * @param {number} maxScalingDelta - Max scaling delta (default 250)
 * @param {number} surplusGainFactor - Scaling factor for surplus gain (S) (default 8)
 * @param {number} deficitPenaltyFactor - Scaling factor for deficit penalty (D) (default 10)
 * @returns {Object} Daily credit score update with calculation details
 */
export function calculateDailyEnergyCreditUpdate(energyCapacity, totalEnergyExpenditure, maxScalingDelta = 250, surplusGainFactor = 8, deficitPenaltyFactor = 10) {
    // Calculate energy delta
    const energyDelta = energyCapacity - totalEnergyExpenditure;
    
    // Scale the energy delta
    const scaledEnergyDelta = energyDelta / maxScalingDelta;
    
    let creditScoreChange;
    let calculationMethod;
    
    if (energyDelta > 0) {
        // Energy surplus: positive credit score change
        // ΔCreditScore = +S × tanh(scaled_EnergyDelta)
        creditScoreChange = surplusGainFactor * Math.tanh(scaledEnergyDelta);
        calculationMethod = 'surplus_gain';
    } else if (energyDelta < 0) {
        // Energy deficit: negative credit score change
        // ΔCreditScore = -D × tanh(|scaled_EnergyDelta|)
        creditScoreChange = -deficitPenaltyFactor * Math.tanh(Math.abs(scaledEnergyDelta));
        calculationMethod = 'deficit_penalty';
    } else {
        // Perfect balance: no change
        creditScoreChange = 0;
        calculationMethod = 'perfect_balance';
    }
    
    return {
        creditScoreChange: Math.round(creditScoreChange * 100) / 100, // Round to 2 decimal places
        energyDelta,
        scaledEnergyDelta: Math.round(scaledEnergyDelta * 1000) / 1000, // Round to 3 decimal places
        calculationMethod,
        components: {
            energyCapacity,
            totalEnergyExpenditure,
            energyDelta,
            maxScalingDelta,
            surplusGainFactor,
            deficitPenaltyFactor,
            tanhValue: energyDelta !== 0 ? Math.tanh(Math.abs(scaledEnergyDelta)) : 0
        },
        inputs: {
            energyCapacity,
            totalEnergyExpenditure,
            maxScalingDelta,
            surplusGainFactor,
            deficitPenaltyFactor
        }
    };
}

/**
 * Calculate Total Energy Credit Score using sigmoid function
 * @param {number} currentScore - Yesterday's Total Energy Credit Score
 * @param {number} rollingAvgCreditChanges - Time-weighted average of past ΔCreditScores over the past week
 * @param {number} maxCreditScore - Maximum credit score (default 1000)
 * @returns {Object} Total Energy Credit Score with calculation details
 */
export function calculateTotalEnergyCreditScore(currentScore, rollingAvgCreditChanges, maxCreditScore = 1000) {
    // Sigmoid function: sigmoid(x) = 1 / (1 + exp(-x))
    const sigmoidInput = currentScore + rollingAvgCreditChanges;
    const sigmoidValue = 1 / (1 + Math.exp(-sigmoidInput));
    
    // Apply max credit score scaling
    const totalEnergyCreditScore = maxCreditScore * sigmoidValue;
    
    return {
        value: Math.round(totalEnergyCreditScore * 100) / 100, // Round to 2 decimal places
        currentScore,
        rollingAvgCreditChanges,
        maxCreditScore,
        components: {
            sigmoidInput: Math.round(sigmoidInput * 1000) / 1000, // Round to 3 decimal places
            sigmoidValue: Math.round(sigmoidValue * 1000) / 1000,
            scaledScore: totalEnergyCreditScore
        },
        inputs: {
            currentScore,
            rollingAvgCreditChanges,
            maxCreditScore
        },
        trend: null // Not calculated in this implementation
    };
}

/**
 * Calculate complete Energy Credit Score (combines daily update and total score)
 * @param {number} energyCapacity - Energy Capacity (kcal/day)
 * @param {number} totalEnergyExpenditure - Total Energy Expenditure (TEE) (kcal/day)
 * @param {number} currentScore - Yesterday's Total Energy Credit Score
 * @param {number} rollingAvgCreditChanges - Rolling average of past credit changes
 * @param {number} maxScalingDelta - Max scaling delta (default 250)
 * @param {number} surplusGainFactor - Scaling factor for surplus gain (default 8)
 * @param {number} deficitPenaltyFactor - Scaling factor for deficit penalty (default 10)
 * @param {number} maxCreditScore - Maximum credit score (default 1000)
 * @returns {Object} Complete Energy Credit Score calculation
 */
export function calculateEnergyCreditScore(energyCapacity, totalEnergyExpenditure, currentScore, rollingAvgCreditChanges, maxScalingDelta = 250, surplusGainFactor = 8, deficitPenaltyFactor = 10, maxCreditScore = 1000) {
    // Calculate daily credit score change
    const dailyUpdate = calculateDailyEnergyCreditUpdate(
        energyCapacity,
        totalEnergyExpenditure,
        maxScalingDelta,
        surplusGainFactor,
        deficitPenaltyFactor
    );
    
    // Calculate total energy credit score
    const totalScore = calculateTotalEnergyCreditScore(
        currentScore,
        rollingAvgCreditChanges,
        maxCreditScore
    );
    
    return {
        value: totalScore.value,
        dailyUpdate,
        totalScore,
        energyDelta: dailyUpdate.energyDelta,
        creditScoreChange: dailyUpdate.creditScoreChange,
        inputs: {
            energyCapacity,
            totalEnergyExpenditure,
            currentScore,
            rollingAvgCreditChanges,
            maxScalingDelta,
            surplusGainFactor,
            deficitPenaltyFactor,
            maxCreditScore
        },
        trend: null // Not calculated in this implementation
    };
}

/**
 * Compare calculated Energy Credit Score with API result and provide analysis
 * @param {Object} calculatedEnergyCreditScore - Our calculated Energy Credit Score
 * @param {Object} apiEnergyCreditScore - API's Energy Credit Score
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareEnergyCreditScore(calculatedEnergyCreditScore, apiEnergyCreditScore, metrics) {
    if (!apiEnergyCreditScore || apiEnergyCreditScore.value === null) {
        return {
            available: false,
            message: 'API Energy Credit Score not available for comparison'
        };
    }

    const valueDiff = Math.abs(calculatedEnergyCreditScore.value - apiEnergyCreditScore.value);
    const isWithinRange = valueDiff <= 50; // Allow 50 points difference

    return {
        available: true,
        valueDiff,
        isWithinRange,
        calculatedEnergyCreditScore,
        apiEnergyCreditScore,
        metrics: {
            energyCapacity: calculatedEnergyCreditScore.inputs.energyCapacity,
            totalEnergyExpenditure: calculatedEnergyCreditScore.inputs.totalEnergyExpenditure,
            currentScore: calculatedEnergyCreditScore.inputs.currentScore,
            rollingAvgCreditChanges: calculatedEnergyCreditScore.inputs.rollingAvgCreditChanges,
            energyDelta: calculatedEnergyCreditScore.energyDelta,
            creditScoreChange: calculatedEnergyCreditScore.creditScoreChange,
            calculationMethod: calculatedEnergyCreditScore.dailyUpdate.calculationMethod
        },
        message: isWithinRange ? 
            '✅ Energy Credit Score calculation matches API within acceptable range' :
            `⚠️ Energy Credit Score calculation differs significantly from API (diff: ${valueDiff.toFixed(1)} points)`
    };
}

import {sleep} from "../../utils/async-helper.js";

export const mockEnergyCreditScoreTest = async () => {
    await sleep(2000);
    
    // Test case 1: Perfect energy balance
    const result1 = calculateEnergyCreditScore(2500, 2500, 500, 0);
    console.info('Energy Credit Score Test 1 (Perfect Balance) =', result1);
    
    // Test case 2: Energy surplus
    const result2 = calculateEnergyCreditScore(2750, 2500, 500, 1.5);
    console.info('Energy Credit Score Test 2 (Energy Surplus) =', result2);
    
    // Test case 3: Energy deficit
    const result3 = calculateEnergyCreditScore(2250, 2500, 500, -1.2);
    console.info('Energy Credit Score Test 3 (Energy Deficit) =', result3);
    
    // Test case 4: Large surplus with high current score
    const result4 = calculateEnergyCreditScore(3000, 2500, 800, 3.0);
    console.info('Energy Credit Score Test 4 (Large Surplus) =', result4);
    
    // Test case 5: Large deficit with low current score
    const result5 = calculateEnergyCreditScore(2000, 2500, 200, -2.5);
    console.info('Energy Credit Score Test 5 (Large Deficit) =', result5);
    
    // Test case 6: Daily update only
    const dailyUpdate1 = calculateDailyEnergyCreditUpdate(2600, 2500);
    console.info('Daily Credit Update Test 1 =', dailyUpdate1);
    
    // Test case 7: Total score calculation
    const totalScore1 = calculateTotalEnergyCreditScore(500, 2.0);
    console.info('Total Credit Score Test 1 =', totalScore1);
    
    // Test case 8: Edge case - zero energy capacity
    const result8 = calculateEnergyCreditScore(0, 2000, 500, 0);
    console.info('Energy Credit Score Test 8 (Zero Capacity) =', result8);
    
    // Test case 9: Edge case - extreme surplus
    const result9 = calculateEnergyCreditScore(5000, 2000, 300, 1.0);
    console.info('Energy Credit Score Test 9 (Extreme Surplus) =', result9);
    
    return { result1, result2, result3, result4, result5, dailyUpdate1, totalScore1, result8, result9 };
}
mockEnergyCreditScoreTest();