// hrd.js
// Heart Rate Deviation Score (HRD)
// Formula: HRD = 100 × exp(-((x - μ)²) / (2 × σ²))
// x = ((Resting HR − Sleep HR) ÷ Resting HR) × 100
// if x >= μ → HRD = 100
// μ = 20, σ = 5

export function HRD({ restingHR, sleepHR, mu = 20, sigma = 5 }) {
    const x = ((restingHR - sleepHR) / restingHR) * 100;
  
    if (x >= mu) return 100;
  
    const val = 100 * Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));
    return Number(val.toFixed(2));
  }
  
  // === Приклад із твоїми даними ===
  const result = HRD({ restingHR: 67, sleepHR: 49, mu: 20, sigma: 5 });
  console.info('Heart Rate Deviation Score (HRD) =', result);
  