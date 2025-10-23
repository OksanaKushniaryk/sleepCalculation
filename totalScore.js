// sleep_score.js

import { TSD } from "./tsd.js";
import { SE } from "./se.js";
import { DSS } from "./dss.js";
import { RSS } from "./rss.js";
import { SSD } from "./ssd.js";
import { SOL } from "./sol.js";
import { WASO } from "./waso.js";
import { HRD } from "./hrd.js";
import { CAS } from "./cas.js";
import { SCS } from "./scs.js";
import { NSC } from "./nsc.js";

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
const subScores = {
  TSD: 100, 
  SE: 99.42, 
  DSS: 65.13, 
  RSS: 77.92, 
  SSD: 71.53,
  SOL: 100, 
  WASO: 100, 
  HRD: 100, 
  CAS: 51, 
  SCS: 89.68, 
  NSC: 100
};

const result = sleepScore(subScores);

console.log("---- Sub-scores ----");
console.table(subScores);
console.log('SleepS =', result);
