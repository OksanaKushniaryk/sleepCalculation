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
export function calculateRHRfor30min(heartRateReadings, totalStepsLast30Min, fallbackRHR = 70) {
    // RHR Estimation Logic from specification:
    // If user has taken fewer than 300 steps in last 30 minutes, they are considered at rest
    if (totalStepsLast30Min < 300) {
        return {
            value: fallbackRHR,
            calculationMethod: 'fallback_active',
            inputs: {
                heartRateReadings: heartRateReadings ? heartRateReadings.length : 0,
                totalStepsLast30Min,
                fallbackRHR
            },
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
    };
}