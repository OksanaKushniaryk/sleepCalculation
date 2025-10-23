// ssd_from_stages.js
// Обчислює DSS і RSS зі стадій, потім SSD = (RSS/2) + (DSS/2)
// Параметри за замовчуванням: μ_DSS=18, σ_DSS=5; μ_RSS=22, σ_RSS=5

function toHours(h, m = 0) {
    return Number(h) + Number(m) / 60;
  }
  
  function DSS({ deep, core, rem, mu = 18, sigma = 5 }) {
    const total = deep + core + rem;
    if (total === 0) return 0;
    const p = (deep / total) * 100;
    const val = 100 * Math.exp(-((p - mu) ** 2) / (2 * sigma ** 2));
    return Number(val.toFixed(2));
  }
  
  function RSS({ deep, core, rem, mu = 22, sigma = 5 }) {
    const total = deep + core + rem;
    if (total === 0) return 0;
    const p = (rem / total) * 100;
    const val = 100 * Math.exp(-((p - mu) ** 2) / (2 * sigma ** 2));
    return Number(val.toFixed(2));
  }
  
export function SSD({ deepH, deepM, coreH, coreM, remH, remM, dssMu = 18, dssSigma = 5, rssMu = 22, rssSigma = 5 }) {
  const deep = toHours(deepH, deepM);
  const core = toHours(coreH, coreM);
  const rem  = toHours(remH, remM);

  const dss = DSS({ deep, core, rem, mu: dssMu, sigma: dssSigma });
  const rss = RSS({ deep, core, rem, mu: rssMu, sigma: rssSigma });

  const ssd = (rss / 2) + (dss / 2);
  return {
    dss,
    rss,
    ssd: Number(ssd.toFixed(2))
  };
}
  
  // === Приклад із твоїми даними ===
  const { dss, rss, ssd } = SSD({
    deepH: 2,  deepM: 25,
    coreH: 4,  coreM: 28,
    remH:  1,  remM: 51
  });
  
  console.info('DSS =', dss);
  console.info('RSS =', rss);
  console.info('Sleep Stage Distribution Score (SSD) =', ssd);
  