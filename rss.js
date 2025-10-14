// rss.js
// REM Sleep Score (RSS) = 100 × exp(-((p - μ)²) / (2 × σ²))
// μ = 22 (ideal %), σ = 5, p = REM / (Deep + Core + REM) × 100

function toHours(h, m = 0) {
    return Number(h) + Number(m) / 60;
  }
  
export function RSS({ deepH, deepM, coreH, coreM, remH, remM, mu = 22, sigma = 5 }) {
  const deep = toHours(deepH, deepM);
  const core = toHours(coreH, coreM);
  const rem  = toHours(remH, remM);

  const totalSleep = deep + core + rem;
  if (totalSleep === 0) return 0;

  const p = (rem / totalSleep) * 100; // actual REM sleep %
  const rss = 100 * Math.exp(-((p - mu) ** 2) / (2 * sigma ** 2));

  return Number(rss.toFixed(2));
}
  
  // === Приклад із твоїми даними ===
  const result = RSS({
    deepH: 2,  deepM: 25,
    coreH: 4,  coreM: 28,
    remH:  1,  remM: 51,
    mu: 22, sigma: 5
  });
  
  console.log('REM Sleep Score (RSS) =', result);
  