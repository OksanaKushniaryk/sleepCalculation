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
            inputs: {providedRHR: heartRateData},
            components: {isAtRest: null, stepsThreshold: 300, averageHR: heartRateData}
        };
    } else if (Array.isArray(heartRateData)) {
        // Calculate RHR from heart rate readings
        rhrResult = calculateRHRfor30min(heartRateData, totalStepsLast30Min, fallbackRHR);
    } else {
        // No data provided, use fallback
        rhrResult = calculateRHRfor30min([], totalStepsLast30Min, fallbackRHR);
    }

    // Calculate parasympathetic score based on RHR
    const parasympatheticResult = calculateParasympatheticScore(rhrResult.value, muRHR, sigmaRHR);

    // Calculate overall stress score
    const overallStressResult = parasympatheticResult;

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