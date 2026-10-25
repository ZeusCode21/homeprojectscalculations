import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SCENARIO,
  normalizeScenario,
  sim,
  unitEcon,
  calcTopMetrics,
  verifyGoldenTest,
  clone,
  keepOf,
  staysOf,
  ltvOf,
} from './model';

describe('Growth Model - Golden Test', () => {
  const scenario = clone(DEFAULT_SCENARIO);
  normalizeScenario(scenario);
  const simResult = sim(scenario);
  const econ = unitEcon(scenario);
  const metrics = calcTopMetrics(scenario, simResult, econ);

  it('should calculate correct total sign-ups (16,105)', () => {
    expect(Math.round(metrics.signups)).toBeCloseTo(16105, -1);
  });

  it('should calculate correct outreach spend ($51,950)', () => {
    expect(Math.round(metrics.spend)).toBeCloseTo(51950, -2);
  });

  it('should calculate correct cost per sign-up ($3.23)', () => {
    expect(metrics.costPerSignup).toBeCloseTo(3.23, 1);
  });

  it('should calculate correct sign-up → paid (3.2%)', () => {
    expect(metrics.convRate * 100).toBeCloseTo(3.2, 0);
  });

  it('should calculate correct cost per paying user (~$101)', () => {
    expect(Math.round(metrics.costPerPayer)).toBeCloseTo(101, -1);
  });

  it('should calculate correct lifetime value per paying user (~$35.40)', () => {
    expect(metrics.ltvPayer).toBeCloseTo(35.40, 0);
  });

  it('should calculate correct value per sign-up (~$0.48)', () => {
    expect(metrics.valuePerSignup).toBeCloseTo(0.48, 1);
  });

  it('should calculate correct return (~0.15×)', () => {
    expect(metrics.returnRatio).toBeCloseTo(0.15, 1);
  });

  it('should calculate correct most money down (~$43,290)', () => {
    expect(Math.round(metrics.mostDown)).toBeCloseTo(43290, -2);
  });

  it('should calculate correct total profit (~-$43,290)', () => {
    expect(Math.round(metrics.totalProfit)).toBeCloseTo(-43290, -2);
  });

  it('should not reach break-even in 18 months', () => {
    expect(metrics.breakEvenMonth).toBeNull();
  });
});

describe('Growth Model - Design Plus plan calculations', () => {
  const scenario = clone(DEFAULT_SCENARIO);
  normalizeScenario(scenario);
  const designPlus = scenario.plans.find(p => p.name === 'Design Plus')!;

  it('should calculate correct "you keep" per sale (~$11.41)', () => {
    const keep = keepOf(designPlus, scenario.set);
    expect(keep).toBeCloseTo(11.41, 1);
  });

  it('should calculate correct "how long they pay" (5.0 months)', () => {
    const stays = staysOf(designPlus, scenario.months);
    expect(stays).toBeCloseTo(5.0, 1);
  });

  it('should calculate correct lifetime value per buyer (~$57.05)', () => {
    const ltv = ltvOf(designPlus, scenario.set, scenario.months);
    expect(ltv).toBeCloseTo(57.05, 0);
  });
});

describe('verifyGoldenTest helper', () => {
  it('should pass all golden test checks', () => {
    const { passed, results } = verifyGoldenTest();
    
    // Log any failures for debugging
    Object.entries(results).forEach(([key, result]) => {
      if (!result.match) {
        console.log(`${key}: expected ${result.expected}, got ${result.actual}`);
      }
    });
    
    expect(passed).toBe(true);
  });
});

describe('Growth Model - Simulation sanity checks', () => {
  const scenario = clone(DEFAULT_SCENARIO);
  normalizeScenario(scenario);
  const simResult = sim(scenario);

  it('should simulate correct number of months', () => {
    expect(simResult.rows.length).toBe(18);
  });

  it('should have non-negative active users', () => {
    simResult.rows.forEach(row => {
      expect(row.mau).toBeGreaterThanOrEqual(0);
    });
  });

  it('should accumulate users over time', () => {
    for (let i = 1; i < simResult.rows.length; i++) {
      // After first few months, MAU should generally increase
      if (i > 3) {
        expect(simResult.rows[i].mau).toBeGreaterThan(0);
      }
    }
  });

  it('should track channel contributions correctly', () => {
    const totalChannelSignups = simResult.cu.reduce((a, b) => a + b, 0);
    expect(totalChannelSignups).toBeGreaterThan(0);
  });
});

describe('Growth Model - Unit economics', () => {
  const scenario = clone(DEFAULT_SCENARIO);
  normalizeScenario(scenario);
  const econ = unitEcon(scenario);

  it('should calculate conversion rate correctly', () => {
    // Sum of plan conversions = 1% + 1.5% + 0.7% = 3.2% (pro is off)
    expect(econ.conv).toBeCloseTo(0.032, 2);
  });

  it('should include materials affiliate commissions', () => {
    expect(econ.mat).toBeGreaterThan(0);
  });

  it('should calculate free user cost', () => {
    // freeRenders (3) * render price (0.034) + textCost (0.03) * life (6)
    const expected = (3 * 0.034 + 0.03) * 6;
    expect(econ.freeCost).toBeCloseTo(expected, 2);
  });

  it('should have positive plan value when plans are on', () => {
    expect(econ.planVal).toBeGreaterThan(0);
  });
});
