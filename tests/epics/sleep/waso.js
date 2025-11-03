// waso.js
// Wake After Sleep Onset (WASO) Score
// Formula: WASO = 100 × exp(- (x²) / (2 × σ²))
// x = actual WASO in minutes
// σ = 20

export function WASO({ x, sigma = 20 }) {
    const val = 100 * Math.exp(-((x ** 2) / (2 * sigma ** 2)));
    return Number(val.toFixed(2));
  }
  
  // === Приклад із твоїми даними ===
  const result = WASO({ x: 0, sigma: 20 });
  console.info('Wake After Sleep Onset (WASO) Score =', result);
  