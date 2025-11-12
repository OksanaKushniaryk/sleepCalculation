/**
 * Energy Safe Zone Calculation
 *
 * Energy Safe Zone represents a recommended range of energy balance based on historical data.
 * It provides users with a personalized target range for sustainable energy management.
 *
 * Formula: EnergySafeZone = +/- average(EnergyDelta in last week) +/- 50
 *
 * The safe zone is calculated based on previous 7 records (weekly average).
 * If the user doesn't have any records (first day), no safe zone is displayed.
 * Safe zones can be calculated for each day independently (Monday, Tuesday, etc.).
 */

/**
 * Calculate Energy Safe Zone based on historical energy delta data
 * @param {Array} historicalEnergyDeltas - Array of energy deltas from the last 7 days
 * @param {number} bufferZone - Buffer zone around the average (default 50 kcal)
 * @param {number} minHistoryRequired - Minimum number of historical records required (default 3)
 * @returns {Object} Energy Safe Zone with upper and lower bounds
 */
export function calculateEnergySafeZone(historicalEnergyDeltas, bufferZone = 50, minHistoryRequired = 3) {
    // Validate input
    if (!Array.isArray(historicalEnergyDeltas) || historicalEnergyDeltas.length === 0) {
        return {
            available: false,
            message: 'No historical energy delta data available for safe zone calculation',
            upperBound: null,
            lowerBound: null,
            averageEnergyDelta: null,
            bufferZone,
            historicalDataCount: 0,
            calculationMethod: 'insufficient_data'
        };
    }

    // Filter out null/undefined values
    const validDeltas = historicalEnergyDeltas.filter(delta =>
        delta !== null && delta !== undefined && !isNaN(delta)
    );

    // Check if we have enough historical data
    if (validDeltas.length < minHistoryRequired) {
        return {
            available: false,
            message: `Insufficient historical data. Need at least ${minHistoryRequired} records, have ${validDeltas.length}`,
            upperBound: null,
            lowerBound: null,
            averageEnergyDelta: null,
            bufferZone,
            historicalDataCount: validDeltas.length,
            calculationMethod: 'insufficient_data'
        };
    }

    // Calculate average energy delta from historical data
    const totalEnergyDelta = validDeltas.reduce((sum, delta) => sum + delta, 0);
    const averageEnergyDelta = totalEnergyDelta / validDeltas.length;

    // Calculate safe zone bounds
    // EnergySafeZone = +/- average(EnergyDelta in last week) +/- 50
    const upperBound = averageEnergyDelta + bufferZone;
    const lowerBound = averageEnergyDelta - bufferZone;

    return {
        available: true,
        upperBound: Math.round(upperBound * 100) / 100, // Round to 2 decimal places
        lowerBound: Math.round(lowerBound * 100) / 100,
        averageEnergyDelta: Math.round(averageEnergyDelta * 100) / 100,
        bufferZone,
        historicalDataCount: validDeltas.length,
        calculationMethod: 'historical_average',
        range: Math.round((upperBound - lowerBound) * 100) / 100,
        components: {
            historicalDeltas: validDeltas,
            totalDelta: totalEnergyDelta,
            averageDelta: averageEnergyDelta,
            bufferApplied: bufferZone
        },
        inputs: {
            historicalEnergyDeltas: validDeltas,
            bufferZone,
            minHistoryRequired
        },
        trend: null // Not calculated in this implementation
    };
}

/**
 * Compare calculated Energy Safe Zone with API result and provide analysis
 * @param {Object} calculatedEnergySafeZone - Our calculated Energy Safe Zone
 * @param {Object} apiEnergySafeZone - API's Energy Safe Zone
 * @param {Object} metrics - Original metrics used for calculation
 * @returns {Object} Comparison analysis
 */
export function compareEnergySafeZone(calculatedEnergySafeZone, apiEnergySafeZone, metrics) {
    if (!apiEnergySafeZone || (!apiEnergySafeZone.upperBound && !apiEnergySafeZone.lowerBound)) {
        return {
            available: false,
            message: 'API Energy Safe Zone not available for comparison'
        };
    }

    if (!calculatedEnergySafeZone.available) {
        return {
            available: false,
            message: 'Calculated Energy Safe Zone not available due to insufficient historical data'
        };
    }

    const upperBoundDiff = Math.abs(calculatedEnergySafeZone.upperBound - apiEnergySafeZone.upperBound);
    const lowerBoundDiff = Math.abs(calculatedEnergySafeZone.lowerBound - apiEnergySafeZone.lowerBound);
    const maxDiff = Math.max(upperBoundDiff, lowerBoundDiff);
    const isWithinRange = maxDiff <= 25; // Allow 25 kcal difference

    return {
        available: true,
        upperBoundDiff,
        lowerBoundDiff,
        maxDiff,
        isWithinRange,
        calculatedEnergySafeZone,
        apiEnergySafeZone,
        metrics: {
            historicalDataCount: calculatedEnergySafeZone.historicalDataCount,
            averageEnergyDelta: calculatedEnergySafeZone.averageEnergyDelta,
            bufferZone: calculatedEnergySafeZone.bufferZone,
            calculationMethod: calculatedEnergySafeZone.calculationMethod
        },
        message: isWithinRange ?
            '✅ Energy Safe Zone calculation matches API within acceptable range' :
            `⚠️ Energy Safe Zone calculation differs significantly from API (max diff: ${maxDiff.toFixed(1)} kcal)`
    };
}