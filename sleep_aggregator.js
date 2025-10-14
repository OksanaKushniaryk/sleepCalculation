// sleep_aggregator.js
import { TSD } from "./tsd.js";
import { SE } from "./se.js";
import { DSS } from "./dss.js";
import { RSS } from "./rss.js";
import { SOL } from "./sol.js";
import { WASO } from "./waso.js";
import { HRD } from "./hrd.js";
import { CAS, midpointFromFellAsleep } from "./cas.js";
import { SCS } from "./scs.js";
import { NSC } from "./nsc.js";


function round2(n) { return Number(n.toFixed(2)); }

function sleepScore(values) {
  const {
    deepH, deepM, coreH, coreM, remH, remM,
    awakeH, awakeM,
    restingHR, sleepHR,
    fellAsleep, tst,
    observedCycles,
    scsX,
  } = values;

  const tsd = TSD({ deepH, deepM, coreH, coreM, remH, remM, awakeH, awakeM });
  const se  = SE({ deepH, deepM, coreH, coreM, remH, remM, awakeH, awakeM });
  const dss = DSS({ deepH, deepM, coreH, coreM, remH, remM });
  const rss = RSS({ deepH, deepM, coreH, coreM, remH, remM });
  const ssd = (rss / 2) + (dss / 2);
  const sol = SOL({ x: 0, mu: 15, sigma: 10 }); // приклад: latency 15 хв
  const waso = WASO({ x: 0 });
  const hrd = HRD({ restingHR, sleepHR });
  const mid = midpointFromFellAsleep(fellAsleep, tst);
  const cas = CAS({ xHours: mid.hoursDecimal });
  const scs = SCS({ x: scsX });
  const nsc = NSC({ observedCycles });

  const sleepS =
    0.15*tsd + 0.20*se + 0.05*dss + 0.05*rss +
    0.20*ssd + 0.10*sol + 0.05*waso + 0.05*hrd +
    0.05*cas + 0.05*scs + 0.05*nsc;

  console.log("---- Sub-scores ----");
  console.table({ tsd, se, dss, rss, ssd, sol, waso, hrd, cas, scs, nsc });
  console.log("Total SleepS =", round2(sleepS));
}

// === Приклад запуску ===
sleepScore({
  deepH: 2, deepM: 25,
  coreH: 4, coreM: 28,
  remH: 1, remM: 51,
  awakeH: 0, awakeM: 0,
  restingHR: 67, sleepHR: 49,
  fellAsleep: "23:53",
  tst: "8:44",
  observedCycles: 5,
  scsX: 0.083333
});
