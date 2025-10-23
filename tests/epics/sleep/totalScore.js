// sleep_score.js

function round2(n) { return Number(n.toFixed(2)); }

function sleepScore({
  TSD, SE, DSS, RSS, SSD, SOL, WASO, HRD, CAS, SCS, NSC
}) {
  const score =
    0.15*TSD + 0.20*SE + 0.05*DSS + 0.05*RSS +
    0.20*SSD + 0.10*SOL + 0.05*WASO + 0.05*HRD +
    0.05*CAS + 0.05*SCS + 0.05*NSC;
  return round2(score);
}

// === Приклад із твоїми значеннями ===
const result = sleepScore({
  TSD:100, SE:100, DSS:25, RSS:98.67, SSD:57.04,
  SOL:100, WASO:100, HRD:100, CAS:95, SCS:99.38, NSC:100
});

console.info('SleepS =', result);
