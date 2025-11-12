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