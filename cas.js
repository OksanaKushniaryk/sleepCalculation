// cas.js
// Circadian Alignment Score: CAS = max(0, 100 − k * |x − μ|)
// x — sleep midpoint (hours from 00:00..24:00), μ = 4.0, k = 20

function parseHHMM(str) {
    // "23:53" -> minutes since midnight
    const [h, m] = str.split(":").map(Number);
    return (h * 60 + m) % 1440;
  }
  
  function parseTST(value) {
    // Accept "H:MM" or minutes number
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.includes(":")) {
      const [h, m] = value.split(":").map(Number);
      return h * 60 + m;
    }
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error("Invalid TST value");
    return n;
  }
  
export function midpointFromFellAsleep(fellAsleepHHMM, tst) {
  const fell = parseHHMM(fellAsleepHHMM);
  const tstMin = parseTST(tst);
  const midMin = (fell + Math.round(tstMin / 2)) % 1440;
  return {
    minutes: midMin,
    hh: Math.floor(midMin / 60),
    mm: midMin % 60,
    hoursDecimal: midMin / 60
  };
}
  
export function CAS({ xHours, mu = 4.0, k = 20 }) {
  const score = 100 - k * Math.abs(xHours - mu);
  return Math.max(0, Number(score.toFixed(2)));
}

// ==== Приклади запуску ====
  // 1) Із готовим midpoint (у годинах):
  // const score1 = CAS({ xHours: 4.25, mu: 4.0, k: 20 });
  // console.log("CAS =", score1);
  
  // 2) З часу засинання та TST:
  const mid = midpointFromFellAsleep("23:53", "8:44");
  const score2 = CAS({ xHours: mid.hoursDecimal, mu: 4.0, k: 20 });
  
  const hh = String(mid.hh).padStart(2, "0");
  const mm = String(mid.mm).padStart(2, "0");
  console.log(`Midpoint = ${hh}:${mm} (${mid.hoursDecimal.toFixed(2)} h)`);
  console.log("Circadian Alignment Score (CAS) =", score2);
  