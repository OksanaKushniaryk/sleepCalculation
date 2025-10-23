// dss.js
// Deep Sleep Score (DSS) = 100 × exp(-((p - μ)²) / (2 × σ²))
// μ = 18 (ideal %), σ = 5, p = Deep / (Deep + Core + REM) × 100

function toHours(h, m = 0) {
    return Number(h) + Number(m) / 60;
  }
  
export function DSS({ deepH, deepM, coreH, coreM, remH, remM, mu = 18, sigma = 5 }) {
  const deep = toHours(deepH, deepM);
  const core = toHours(coreH, coreM);
  const rem  = toHours(remH, remM);

  const totalSleep = deep + core + rem;
  if (totalSleep === 0) return 0;

  const p = (deep / totalSleep) * 100; // actual deep sleep %
  const dss = 100 * Math.exp(-((p - mu) ** 2) / (2 * sigma ** 2));

  return Number(dss.toFixed(2));
}
  
  // === Приклад із твоїми даними ===
  const result = DSS({
    deepH: 2,  deepM: 25,
    coreH: 4,  coreM: 28,
    remH:  1,  remM: 51,
    mu: 18, sigma: 5
  });
  
  console.info('Deep Sleep Score (DSS) =', result);
  