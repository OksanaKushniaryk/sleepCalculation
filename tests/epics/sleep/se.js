// se.js
// Sleep Efficiency (SE) = (Total Sleep Time / Time in Bed) × 100
// Total Sleep Time = Deep + Core + REM
// Time in Bed = Deep + Core + REM + Awake

function toHours(h, m = 0) {
    return Number(h) + Number(m) / 60;
  }
  
export function SE({ deepH, deepM, coreH, coreM, remH, remM, awakeH = 0, awakeM = 0 }) {
  const deep = toHours(deepH, deepM);
  const core = toHours(coreH, coreM);
  const rem  = toHours(remH, remM);
  const awake = toHours(awakeH, awakeM);

  const totalSleepTime = deep + core + rem;
  const timeInBed = deep + core + rem + awake;

  if (timeInBed === 0) return 0; // захист від ділення на 0

  const se = (totalSleepTime / timeInBed) * 100;
  return Number(se.toFixed(2));
}
  
  // === Приклад із твоїми даними ===
  const result = SE({
    deepH: 2,  deepM: 25,
    coreH: 4,  coreM: 28,
    remH:  1,  remM: 51,
    awakeH: 0, awakeM: 0
  });
  
  console.info('Sleep Efficiency (SE) =', result);
  