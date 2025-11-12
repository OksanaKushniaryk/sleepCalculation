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

import {sleep} from "../../../utils/async-helper.js";
import {calculateStressScore} from "../stress-score.js";

export const mockStressScoreTest = async () => {
    await sleep(2000);
    /// real test
    const result = calculateStressScore(70);
    // const result = calculateStressScore([120, 85, 60, 53, 14, 134, 120, 85, 60, 53, 14, 134, 120, 85, 60, 53, 14, 134, 120, 85, 60, 53, 14, 134]);

    console.info('calculate Stress Score =', result);

    return result;
}
mockStressScoreTest();