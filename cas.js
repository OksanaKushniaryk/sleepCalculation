// cas_score.js
// Circadian Alignment Score (CAS) = max(0, 100 − k × |x − μ|)
// x — sleep midpoint (in hours, 0..24)
// μ — ideal midpoint (4.0 = 4:00 AM)
// k — sensitivity factor (20)


// === 🔧 Дані для зміни (тут вводь свої значення) ===
const x = 1.55;   // фактичний midpoint у годинах (1.55 = ~01:33)
const mu = 4.0;   // ідеальний midpoint = 4:00 AM
const k = 20;     // коефіцієнт
// ===============================================


function CAS(x, mu, k) {
  const deviation = Math.abs(x - mu);
  const raw = 100 - k * deviation;
  const result = Math.max(0, raw);
  return Number(result.toFixed(2));
}

// ==== Обчислення ====
const score = CAS(x, mu, k);

console.log("---- Circadian Alignment Score ----");
// console.log(`x (midpoint): ${x} h`);
// console.log(`μ (ideal): ${mu} h`);
// console.log(`k (sensitivity): ${k}`);
// console.log(`|x - μ| = ${Math.abs(x - mu).toFixed(2)} h`);
console.log(`CAS = ${score}`);
  
