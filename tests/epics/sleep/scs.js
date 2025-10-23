// scs.js
// Sleep Consistency Score (SCS) = 100 × exp(−(x²) / (2 × σ²))
// x = average day-to-day variation in sleep start time (hours)
// σ = 0.75

export function SCS({ x, sigma = 0.75 }) {
    const val = 100 * Math.exp(-(x ** 2) / (2 * sigma ** 2));
    return Number(val.toFixed(2));
  }
  
  // === Приклад із твоїми даними ===
  const result = SCS({ x: 0.083333, sigma: 0.75 });
  console.info('Sleep Consistency Score (SCS) =', result);
  
