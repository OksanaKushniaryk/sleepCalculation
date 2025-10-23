// nsc.js
// Number of Sleep Cycles (NSC) = (Observed Cycles / 5) × 100
// 5 is the ideal number of NREM–REM cycles
// Capped at 100, with mild penalty for <4 or >6 cycles (optional adjustment)

export function NSC({ observedCycles }) {
    // базовий розрахунок
    let score = (observedCycles / 5) * 100;
  
    // часткове покарання за аномальні значення
    if (observedCycles < 4) {
      // нижчі значення мають більшу втрату
      score *= 0.9; // наприклад, 10% штраф
    } else if (observedCycles > 6) {
      // надлишок циклів також небажаний
      score *= 0.95;
    }
  
    // обмеження 0–100
    if (score > 100) score = 100;
    if (score < 0) score = 0;
  
    return Number(score.toFixed(2));
  }
  
  // === Приклад із твоїми даними ===
  const result = NSC({ observedCycles: 5 });
  console.info('Number of Cycles Score (NSC) =', result);
  