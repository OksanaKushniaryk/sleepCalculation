// SOL.js

// SOL (Sleep Onset Latency)
// Formula: if x ≤ μ → SOL = 100; else SOL = 100 * exp(-((x - μ)^2) / (2 * σ^2))
// where x - actual sleep onset latency in minutes. For each session, time from session start to the first non-Wake stage. Average across all sessions in that day.
// 06.10.2025 -> Awake = 0m, Fell asleep 11:53 PM 
// x (sleep onset latency) = 0 m
// μ = 15 (maximum normal sleep onset latency in minutes), 
// σ = 10 (spread or tolerance)

export function SOL({ x, mu = 15, sigma = 10 }) {
    if (x <= mu) {
      return 100;
    }
    const sol = 100 * Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));
    return Number(sol.toFixed(2));
  }
  
  // ==== Тестовий запуск ====
  const testValue = 0; // тут підставляєш значення x
  const result = SOL({ x: testValue });
  
  console.log(`Sleep Onset Latency Score (SOL) = ${result}`);
  