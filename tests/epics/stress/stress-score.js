/**
 * Stress Score Calculation
 * 
 * Stress score is primarily based on Resting Heart Rate (RHR) with parasympathetic scoring.
 * Lower RHR indicates more parasympathetic (less stress), higher RHR indicates more sympathetic (more stress).
 * 
 * Formula from OneVital specification:
 * RHR_Para(x) = if x >= μ_rhr: 0
 *               else: 100 * (1 - exp(- ((μ_rhr - x)^2) / (2 * σ_rhr^2)))
 * 
 * where: x = resting heart rate (bpm), μ_rhr = 100 bpm, σ_rhr = 15 bpm
 * Overall_Stress = RHR_Para (inverted - high parasympathetic = low stress)
 */

/**
 * Calculate Resting Heart Rate (RHR) based on heart rate and activity data
 * @param {Array} heartRateReadings - Array of heart rate readings from last 30 minutes
 * @param {number} totalStepsLast30Min - Total steps taken in last 30 minutes
 * @param {number} fallbackRHR - Fallback RHR if calculation not possible
 * @returns {Object} RHR calculation result
 */
export function calculateRHR(heartRateReadings, totalStepsLast30Min, fallbackRHR = 70) {
    // RHR Estimation Logic from specification:
    // If user has taken fewer than 300 steps in last 30 minutes, they are considered at rest
    if (totalStepsLast30Min >= 300) {
        return {
            value: fallbackRHR,
            calculationMethod: 'fallback_active',
            inputs: {
                heartRateReadings: heartRateReadings ? heartRateReadings.length : 0,
                totalStepsLast30Min,
                fallbackRHR
            },
            components: {
                isAtRest: false,
                stepsThreshold: 300,
                averageHR: null
            }
        };
    }

    // Calculate average heart rate from readings during rest period
    if (!heartRateReadings || heartRateReadings.length === 0) {
        return {
            value: fallbackRHR,
            calculationMethod: 'fallback_no_data',
            inputs: {
                heartRateReadings: 0,
                totalStepsLast30Min,
                fallbackRHR
            },
            components: {
                isAtRest: true,
                stepsThreshold: 300,
                averageHR: null
            }
        };
    }

    const averageHR = heartRateReadings.reduce((sum, hr) => sum + hr, 0) / heartRateReadings.length;

    return {
        value: Math.round(averageHR * 100) / 100, // Round to 2 decimal places
        calculationMethod: 'calculated_from_data',
        inputs: {
            heartRateReadings: heartRateReadings.length,
            totalStepsLast30Min,
            fallbackRHR
        },
        components: {
            isAtRest: true,
            stepsThreshold: 300,
            averageHR: averageHR,
            heartRateRange: {
                min: Math.min(...heartRateReadings),
                max: Math.max(...heartRateReadings),
                count: heartRateReadings.length
            }
        }
    };
}

/**
 * Calculate parasympathetic score based on RHR
 * @param {number} rhr - Resting heart rate in bpm
 * @param {number} muRHR - Baseline RHR (default 100 bpm)
 * @param {number} sigmaRHR - Tolerance/sigma for RHR (default 15 bpm)
 * @returns {Object} Parasympathetic score calculation result
 */
export function calculateParasympatheticScore(rhr, muRHR = 100, sigmaRHR = 15) {
    let parasympatheticScore;
    
    // RHR_Para(x) = if x >= μ_rhr: 0
    //               else: 100 * (1 - exp(- ((μ_rhr - x)^2) / (2 * σ_rhr^2)))
    if (rhr >= muRHR) {
        parasympatheticScore = 0;
    } else {
        const delta = muRHR - rhr;
        const variance = 2 * sigmaRHR * sigmaRHR;
        parasympatheticScore = 100 * (1 - Math.exp(-(delta * delta) / variance));
    }

    return {
        value: Math.round(parasympatheticScore * 100) / 100,
        calculationMethod: 'rhr_parasympathetic_formula',
        inputs: {
            rhr,
            muRHR,
            sigmaRHR
        },
        components: {
            delta: rhr >= muRHR ? 0 : muRHR - rhr,
            variance: 2 * sigmaRHR * sigmaRHR,
            isAboveBaseline: rhr >= muRHR,
            exponentialTerm: rhr >= muRHR ? 0 : Math.exp(-((muRHR - rhr) ** 2) / (2 * sigmaRHR * sigmaRHR))
        }
    };
}

/**
 * Calculate overall stress score
 * @param {number} parasympatheticScore - Parasympathetic score (0-100)
 * @returns {Object} Overall stress score calculation result
 */
export function calculateOverallStressScore(parasympatheticScore) {
    // Overall_Stress = RHR_Para
    // Note: High parasympathetic = low stress, so we might want to invert this
    // But according to the specification, Overall_Stress = RHR_Para directly
    const overallStress = parasympatheticScore;

    return {
        value: Math.round(overallStress * 100) / 100,
        calculationMethod: 'direct_parasympathetic',
        inputs: {
            parasympatheticScore
        },
        components: {
            interpretation: overallStress >= 80 ? 'low_stress' : 
                           overallStress >= 60 ? 'moderate_stress' : 
                           overallStress >= 40 ? 'elevated_stress' : 'high_stress'
        }
    };
}

/**
 * Calculate stress score based on resting heart rate
 * @param {number|Array} heartRateData - Either a single RHR value or array of HR readings
 * @param {number} totalStepsLast30Min - Total steps in last 30 minutes (for RHR calculation)
 * @param {number} muRHR - Baseline RHR (default 100 bpm)
 * @param {number} sigmaRHR - Tolerance for RHR (default 15 bpm)
 * @param {number} fallbackRHR - Fallback RHR if calculation not possible
 * @returns {Object} Complete stress score calculation result
 */
export function calculateStressScore(heartRateData, totalStepsLast30Min = 0, muRHR = 100, sigmaRHR = 15, fallbackRHR = 70) {
    let rhrResult;
    
    // Determine if we have pre-calculated RHR or need to calculate it
    if (typeof heartRateData === 'number') {
        // Pre-calculated RHR provided
        rhrResult = {
            value: heartRateData,
            calculationMethod: 'provided_rhr',
            inputs: { providedRHR: heartRateData },
            components: { isAtRest: null, stepsThreshold: 300, averageHR: heartRateData }
        };
    } else if (Array.isArray(heartRateData)) {
        // Calculate RHR from heart rate readings
        rhrResult = calculateRHR(heartRateData, totalStepsLast30Min, fallbackRHR);
    } else {
        // No data provided, use fallback
        rhrResult = calculateRHR([], totalStepsLast30Min, fallbackRHR);
    }

    // Calculate parasympathetic score based on RHR
    const parasympatheticResult = calculateParasympatheticScore(rhrResult.value, muRHR, sigmaRHR);
    
    // Calculate overall stress score
    const overallStressResult = calculateOverallStressScore(parasympatheticResult.value);

    return {
        value: overallStressResult.value,
        calculationMethod: 'rhr_based_stress',
        inputs: {
            heartRateData: typeof heartRateData === 'number' ? heartRateData : 
                          Array.isArray(heartRateData) ? `${heartRateData.length} readings` : 'no_data',
            totalStepsLast30Min,
            muRHR,
            sigmaRHR,
            fallbackRHR
        },
        components: {
            rhr: rhrResult,
            parasympathetic: parasympatheticResult,
            overallStress: overallStressResult
        }
    };
}

/**
 * Compare calculated stress score with API result and provide analysis
 * @param {Object} calculatedStressScore - Our calculated stress score
 * @param {Object} apiStressScore - API's stress score
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareStressScores(calculatedStressScore, apiStressScore, metrics) {
    if (!apiStressScore || apiStressScore.value === null || apiStressScore.value === undefined) {
        return {
            available: false,
            message: 'API stress score not available for comparison'
        };
    }

    const difference = Math.abs(calculatedStressScore.value - apiStressScore.value);
    const percentageDiff = apiStressScore.value !== 0 ? (difference / apiStressScore.value) * 100 : 0;
    const isWithinRange = difference <= 5; // Allow 5 points difference

    return {
        available: true,
        calculatedStressScore,
        apiStressScore,
        difference,
        percentageDiff,
        isWithinRange,
        metrics: {
            rhr: calculatedStressScore.components.rhr.value,
            parasympatheticScore: calculatedStressScore.components.parasympathetic.value,
            calculationMethod: calculatedStressScore.calculationMethod,
            isAtRest: calculatedStressScore.components.rhr.components.isAtRest
        },
        message: isWithinRange ? 
            '✅ Stress score calculation matches API within acceptable range' :
            `⚠️ Stress score calculation differs from API (diff: ${difference.toFixed(2)} points, ${percentageDiff.toFixed(1)}%)`
    };
}