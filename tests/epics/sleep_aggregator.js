// sleep_aggregator.js
import { TSD } from "./sleep/tsd.js";
import { SE } from "./sleep/se.js";
import { DSS } from "./sleep/dss.js";
import { RSS } from "./sleep/rss.js";
import { SOL } from "./sleep/sol.js";
import { WASO } from "./sleep/waso.js";
import { HRD } from "./sleep/hrd.js";
import { CAS, midpointFromFellAsleep } from "./sleep/cas.js";
import { SCS } from "./sleep/scs.js";
import { NSC } from "./sleep/nsc.js";


function round2(n) { return Number(n.toFixed(2)); }

/**
 * Calculate comprehensive sleep quality score (0-100) based on multiple sleep metrics
 * 
 * This function analyzes various aspects of sleep quality including duration, efficiency,
 * sleep stage distribution, heart rate changes, circadian alignment, and consistency
 * to provide an overall sleep score following the OneVital specification.
 * 
 * @param {Object} values - Sleep data and biometric measurements
 * @param {number} values.deepH - Deep sleep hours
 * @param {number} values.deepM - Deep sleep minutes  
 * @param {number} values.coreH - Core/Light sleep hours
 * @param {number} values.coreM - Core/Light sleep minutes
 * @param {number} values.remH - REM sleep hours
 * @param {number} values.remM - REM sleep minutes
 * @param {number} values.awakeH - Time awake during sleep hours
 * @param {number} values.awakeM - Time awake during sleep minutes
 * @param {number} values.restingHR - Resting heart rate (bpm)
 * @param {number} values.sleepHR - Average heart rate during sleep (bpm)
 * @param {string} values.fellAsleep - Time fell asleep (HH:MM format)
 * @param {string} values.tst - Total sleep time (H:MM format)
 * @param {number} values.observedCycles - Number of complete sleep cycles observed
 * @param {number} values.scsX - Sleep consistency parameter (daily variation in hours)
 * 
 * @returns {void} Outputs sleep score and component breakdown to console
 */
function sleepScore(values) {
  // Extract all sleep and biometric data from input
  const {
    deepH, deepM, coreH, coreM, remH, remM,    // Sleep stage durations
    awakeH, awakeM,                            // Wake time during sleep
    restingHR, sleepHR,                        // Heart rate measurements
    fellAsleep, tst,                           // Sleep timing
    observedCycles,                            // Sleep architecture
    scsX,                                      // Consistency metric
  } = values;

  // === CALCULATE INDIVIDUAL SLEEP METRICS (0-100 each) ===
  
  // Total Sleep Duration (15% weight) - Optimal around 8 hours
  const tsd = TSD({ deepH, deepM, coreH, coreM, remH, remM, awakeH, awakeM });
  
  // Sleep Efficiency (20% weight) - Percentage of time in bed actually sleeping
  const se = SE({ deepH, deepM, coreH, coreM, remH, remM, awakeH, awakeM });
  
  // Deep Sleep Score (5% weight) - Quality of restorative N3 sleep
  const dss = DSS({ deepH, deepM, coreH, coreM, remH, remM });
  
  // REM Sleep Score (5% weight) - Quality of dream/cognitive processing sleep
  const rss = RSS({ deepH, deepM, coreH, coreM, remH, remM });
  
  // Sleep Stage Distribution (20% weight) - Balance between REM and deep sleep
  const ssd = (rss / 2) + (dss / 2);
  
  // Sleep Onset Latency (10% weight) - How quickly you fall asleep
  // TODO: Replace with actual sleep onset data instead of hardcoded 0
  const sol = SOL({ x: 0, mu: 15, sigma: 10 }); // Currently using 0 minutes (instant sleep)
  
  // Wake After Sleep Onset (5% weight) - Sleep maintenance quality
  // TODO: Replace with actual wake episode data instead of hardcoded 0
  const waso = WASO({ x: 0 }); // Currently using 0 minutes (no awakenings)
  
  // Heart Rate Deviation (5% weight) - Cardiovascular recovery during sleep
  const hrd = HRD({ restingHR, sleepHR });
  
  // Circadian Alignment Score (5% weight) - How well sleep timing matches natural rhythms
  const mid = midpointFromFellAsleep(fellAsleep, tst); // Calculate sleep midpoint
  const cas = CAS({ xHours: mid.hoursDecimal }); // Score based on 4 AM optimal midpoint
  
  // Sleep Consistency Score (5% weight) - Day-to-day schedule regularity
  const scs = SCS({ x: scsX }); // Lower variation = higher score
  
  // Number of Sleep Cycles (5% weight) - Complete NREM-REM cycle count (optimal: 4-6)
  const nsc = NSC({ observedCycles });

  // === CALCULATE WEIGHTED FINAL SLEEP SCORE ===
  // Note: Current weights sum to 0.95 - should be 1.0 per specification
  const sleepS =
    0.15 * tsd +   // Total Sleep Duration (15%)
    0.20 * se +    // Sleep Efficiency (20%) 
    0.05 * dss +   // Deep Sleep Score (5%)
    0.05 * rss +   // REM Sleep Score (5%)
    0.20 * ssd +   // Sleep Stage Distribution (20%)
    0.10 * sol +   // Sleep Onset Latency (10%)
    0.05 * waso +  // Wake After Sleep Onset (5%)
    0.05 * hrd +   // Heart Rate Deviation (5%) - Should be 2.5% per spec
    0.05 * cas +   // Circadian Alignment (5%)
    0.05 * scs +   // Sleep Consistency (5%)
    0.05 * nsc;    // Number of Sleep Cycles (5%)
    // Missing: Temperature Deviation (2.5%) - not implemented

  // === OUTPUT RESULTS ===
  console.info("---- Sub-scores ----");
  console.table({ tsd, se, dss, rss, ssd, sol, waso, hrd, cas, scs, nsc });
  console.info("Total SleepS =", round2(sleepS));

  return { tsd, se, dss, rss, ssd, sol, waso, hrd, cas, scs, nsc };
}

export { sleepScore };

// === Приклад запуску ===
sleepScore({
  deepH: 2, deepM: 25,
  coreH: 4, coreM: 28,
  remH: 1, remM: 51,
  awakeH: 0, awakeM: 0,
  restingHR: 67, sleepHR: 49,
  fellAsleep: "23:53",
  tst: "8:44",
  observedCycles: 5,
  scsX: 0.083333
});
