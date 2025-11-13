// cas.js
// Circadian Alignment Score (CAS) = max(0, 100 − k × |x − μ|)
// x — sleep midpoint (in hours, 0..24)
// μ — ideal midpoint (4.0 = 4:00 AM)
// k — sensitivity factor (20)

/**
 * Calculate Circadian Alignment Score based on sleep midpoint
 * @param {Object} params - Parameters object
 * @param {number} params.xHours - Sleep midpoint in decimal hours (0-24)
 * @param {number} params.mu - Ideal midpoint (default: 4.0 = 4:00 AM)
 * @param {number} params.k - Sensitivity factor (default: 20)
 * @returns {number} CAS score 0-100
 */
export function CAS({ xHours, mu = 4.0, k = 20 }) {
  const deviation = Math.abs(xHours - mu);
  const raw = 100 - k * deviation;
  const result = Math.max(0, raw);
  return Number(result.toFixed(2));
}

/**
 * Calculate sleep midpoint from fell asleep time and total sleep time
 * @param {string} fellAsleep - Time fell asleep in HH:MM format (e.g., "23:30")
 * @param {string} tst - Total sleep time in H:MM format (e.g., "8:15")
 * @returns {Object} Object with hoursDecimal property
 */
export function midpointFromFellAsleep(fellAsleep, tst) {
  // Parse fell asleep time
  const [fellAsleepH, fellAsleepM] = fellAsleep.split(':').map(Number);
  const fellAsleepDecimal = fellAsleepH + fellAsleepM / 60;
  
  // Parse total sleep time
  const [tstH, tstM] = tst.split(':').map(Number);
  const tstDecimal = tstH + tstM / 60;
  
  // Calculate midpoint
  const midpointDecimal = (fellAsleepDecimal + tstDecimal / 2) % 24;
  
  return {
    hoursDecimal: midpointDecimal
  };
}
