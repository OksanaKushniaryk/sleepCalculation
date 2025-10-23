// Test data fixtures for sleep calculation testing

export const sleepData = {
  // Perfect sleep scenario - high scores expected
  perfect: {
    deepH: 2, deepM: 25,
    coreH: 4, coreM: 28,
    remH: 1, remM: 51,
    awakeH: 0, awakeM: 0,
    restingHR: 67,
    sleepHR: 49,
    fellAsleep: "23:53",
    tst: "8:44",
    observedCycles: 5,
    scsX: 0.083333,
    expectedScores: {
      tsd: 100,
      se: 100,
      dss: 15.4, // Known low score from test report
      rss: 98.67,
      sol: 100,
      waso: 100,
      hrd: 100,
      cas: 95,
      scs: 99.38,
      nsc: 100,
      totalScore: 86.83
    }
  },

  // Short sleep scenario
  shortSleep: {
    deepH: 1, deepM: 0,
    coreH: 2, coreM: 30,
    remH: 0, remM: 45,
    awakeH: 0, awakeM: 15,
    restingHR: 70,
    sleepHR: 55,
    fellAsleep: "01:00",
    tst: "4:30",
    observedCycles: 3,
    scsX: 0.5
  },

  // Poor efficiency scenario
  poorEfficiency: {
    deepH: 1, deepM: 30,
    coreH: 3, coreM: 0,
    remH: 1, remM: 0,
    awakeH: 2, awakeM: 30, // High awake time
    restingHR: 75,
    sleepHR: 70, // Poor HR reduction
    fellAsleep: "02:30",
    tst: "8:00",
    observedCycles: 4,
    scsX: 1.2
  },

  // Long sleep scenario
  longSleep: {
    deepH: 3, deepM: 0,
    coreH: 5, coreM: 0,
    remH: 2, remM: 30,
    awakeH: 0, awakeM: 30,
    restingHR: 60,
    sleepHR: 45,
    fellAsleep: "22:00",
    tst: "11:00",
    observedCycles: 6,
    scsX: 0.05
  },

  // Edge cases
  minimal: {
    deepH: 0, deepM: 30,
    coreH: 1, coreM: 0,
    remH: 0, remM: 30,
    awakeH: 0, awakeM: 0,
    restingHR: 80,
    sleepHR: 75,
    fellAsleep: "03:00",
    tst: "2:00",
    observedCycles: 1,
    scsX: 2.0
  },

  // Zero values (boundary test)
  zero: {
    deepH: 0, deepM: 0,
    coreH: 0, coreM: 0,
    remH: 0, remM: 0,
    awakeH: 0, awakeM: 0,
    restingHR: 60,
    sleepHR: 60,
    fellAsleep: "00:00",
    tst: "0:00",
    observedCycles: 0,
    scsX: 0
  }
};

// Individual module test cases
export const moduleTestCases = {
  tsd: [
    { input: { deepH: 2, deepM: 25, coreH: 4, coreM: 28, remH: 1, remM: 51 }, expected: 100 },
    { input: { deepH: 4, deepM: 0, coreH: 4, coreM: 0, remH: 0, remM: 0 }, expected: 100 },
    { input: { deepH: 0, deepM: 0, coreH: 2, coreM: 0, remH: 0, remM: 0 }, expectedRange: [0, 50] }
  ],

  se: [
    { input: { deepH: 2, deepM: 25, coreH: 4, coreM: 28, remH: 1, remM: 51, awakeH: 0, awakeM: 0 }, expected: 100 },
    { input: { deepH: 1, deepM: 0, coreH: 1, coreM: 0, remH: 1, remM: 0, awakeH: 1, awakeM: 0 }, expected: 75 },
    { input: { deepH: 0, deepM: 0, coreH: 0, coreM: 0, remH: 0, remM: 0, awakeH: 0, awakeM: 0 }, expected: 0 }
  ],

  sol: [
    { input: { x: 0, mu: 15, sigma: 10 }, expected: 100 },
    { input: { x: 15, mu: 15, sigma: 10 }, expectedRange: [30, 70] },
    { input: { x: 60, mu: 15, sigma: 10 }, expectedRange: [0, 10] }
  ],

  waso: [
    { input: { x: 0 }, expected: 100 },
    { input: { x: 30 }, expectedRange: [0, 50] },
    { input: { x: 120 }, expectedRange: [0, 10] }
  ],

  hrd: [
    { input: { restingHR: 67, sleepHR: 49 }, expected: 100 },
    { input: { restingHR: 70, sleepHR: 70 }, expectedRange: [0, 20] },
    { input: { restingHR: 60, sleepHR: 40 }, expected: 100 }
  ],

  cas: [
    { input: { xHours: 4.0 }, expected: 100 },
    { input: { xHours: 2.0 }, expectedRange: [80, 95] },
    { input: { xHours: 8.0 }, expectedRange: [60, 80] }
  ],

  scs: [
    { input: { x: 0 }, expected: 100 },
    { input: { x: 0.5 }, expectedRange: [40, 70] },
    { input: { x: 2.0 }, expectedRange: [0, 20] }
  ],

  nsc: [
    { input: { observedCycles: 5 }, expected: 100 },
    { input: { observedCycles: 4 }, expectedRange: [80, 95] },
    { input: { observedCycles: 2 }, expectedRange: [40, 70] },
    { input: { observedCycles: 0 }, expected: 0 }
  ]
};

// Invalid input test cases
export const invalidInputs = {
  negative: {
    deepH: -1, deepM: 0,
    coreH: 0, coreM: 0,
    remH: 0, remM: 0
  },
  
  string: {
    deepH: "invalid", deepM: 0,
    coreH: 0, coreM: 0,
    remH: 0, remM: 0
  },
  
  null: {
    deepH: null, deepM: 0,
    coreH: 0, coreM: 0,
    remH: 0, remM: 0
  },
  
  undefined: {
    deepH: undefined, deepM: 0,
    coreH: 0, coreM: 0,
    remH: 0, remM: 0
  }
};

// API test data (for future use)
export const apiTestData = {
  validRequest: {
    method: 'POST',
    endpoint: '/api/sleep-score',
    body: sleepData.perfect
  },
  
  invalidRequest: {
    method: 'POST',
    endpoint: '/api/sleep-score',
    body: invalidInputs.negative
  },
  
  missingFields: {
    method: 'POST',
    endpoint: '/api/sleep-score',
    body: { deepH: 2, deepM: 25 } // Missing required fields
  }
};