/**
 * Recovery Score Calculation
 *
 * Recovery Score quantifies how well the body is prepared for stress and activity.
 * Formula: RecoveryScore = (w1 × HRV_score + w2 × SleepScore) / (w1 + w2)
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateRecoveryScore} from "../recovery-score.js";
import {calculateHRVScore} from "../hrv-score.js";

export const mockRecoveryScoreTest = async () => {
    await sleep(2000);

    const result = calculateRecoveryScore(80, 90);

    console.info('calculate Recovery Score =', result);

    return result;
}
mockRecoveryScoreTest();

export const mockRecoveryScoreIntegrationTest = async () => {
    await sleep(1000);
    
    console.info('🔗 Recovery Score Integration Test - Using calculated HRV Score');
    
    // Calculate HRV Score first
    const hrvResult = calculateHRVScore(42, 45, 18, 'general');
    console.info('   Calculated HRV Score:', hrvResult.score);
    console.info('   HRV Details:', {
        current: hrvResult.current,
        baseline: hrvResult.baseline,
        sigma: hrvResult.sigma,
        category: hrvResult.category
    });
    
    // Sleep score from external source (e.g., sleep tracker)
    const sleepScore = 88;
    console.info('   Sleep Score:', sleepScore);
    
    // Now calculate Recovery Score using calculated HRV Score
    const result = calculateRecoveryScore(
        hrvResult.score,  // Using calculated HRV Score instead of hardcoded 80
        sleepScore        // Sleep score
    );
    
    console.info('🎯 Recovery Score (Integration):', result.value);
    console.info('   HRV Score Input:', hrvResult.score);
    console.info('   Sleep Score Input:', sleepScore);
    console.info('   Weights:', result.weights);
    console.info('   Components:', result.components);
    
    return {
        recoveryScore: result,
        dependencies: {
            hrv: hrvResult,
            sleepScore
        }
    };
};

// mockRecoveryScoreIntegrationTest();