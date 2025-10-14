// tsd.js
// TSD = 100 × exp(-((x - μ)^2) / (2 × σ^2))
// Якщо x >= μ → TSD = 100.
// μ = 8 (год), σ = 1.5

// tsd.js (CommonJS, без export/import)

function toHours(h, m = 0) {
    return Number(h) + Number(m) / 60;
  }
  
export function TSD({ deepH, deepM, coreH, coreM, remH, remM, awakeH = 0, awakeM = 0, mu = 8, sigma = 1.5 }) {
  const deep = toHours(deepH, deepM);
  const core = toHours(coreH, coreM);
  const rem  = toHours(remH, remM);
  const awake = toHours(awakeH, awakeM);
  const x = deep + core + rem + awake;

  if (x >= mu) return 100;

  const val = 100 * Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));
  return Number(val.toFixed(2));
}
  
  // === Приклад із твоїми даними ===
  const result = TSD({
    deepH: 2,  deepM: 25,
    coreH: 4,  coreM: 28,
    remH:  1,  remM: 51,
    awakeH: 0, awakeM: 0,
    mu: 8, sigma: 1.5
  });
  
  console.log('TSD =', result);
  