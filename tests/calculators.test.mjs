// Checks the calculator maths against reference figures from the meeting tools.
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// public/calculators.js is a plain browser script. Load it the way a browser
// would, handing it a module object so it exports its pure functions.
const source = readFileSync(fileURLToPath(new URL('../public/calculators.js', import.meta.url)), 'utf8');
const mod = { exports: {} };
new Function('module', 'window', 'document', source)(mod, undefined, undefined);
const calc = mod.exports;

const near = (actual, expected, tolerance = 1) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected} (within ${tolerance}), got ${actual}`);

test('inflation is the shared 5% constant', () => {
  assert.equal(calc.INFLATION, 0.05);
});

test('withdrawal rate table', () => {
  assert.equal(calc.withdrawalRate(55), 4.2);
  assert.equal(calc.withdrawalRate(65), 4.8);
  assert.equal(calc.withdrawalRate(75), 6.2);
  assert.equal(calc.withdrawalRate(100), 25.0);
  assert.equal(calc.withdrawalRate(64.6), 4.8); // rounds the age to a whole number
  near(calc.withdrawalRate(50), 3.7, 1e-9);     // below 55: 4.2 less 0.1 a year
  assert.equal(calc.withdrawalRate(40), 3.5);   // never below 3.5
  assert.equal(calc.withdrawalRate(104), 25.0); // above 100
  assert.equal(Object.keys(calc.WITHDRAWAL_RATES).length, 46);
});

// age, retire, savings, monthly, slider (fraction), savings at retirement in today's money, monthly income
const savingsCases = [
  [40, 65, 1500000, 10000, 0.04, 8647280, 34589],
  [50, 60, 4000000, 25000, 0.04, 9351668, 35069],
  [30, 67, 0, 5000, 0.05, 5757938, 23991],
  [45, 65, 2000000, 8000, 0.00, 3870107, 15480],
  [58, 70, 8000000, 0, 0.03, 11217691, 49545],
];

for (const [age, retirementAge, savings, monthlySaving, extraReturn, capital, income] of savingsCases) {
  test(`savings calculator: age ${age}, retire ${retirementAge}, R${savings} saved, R${monthlySaving} a month`, () => {
    const r = calc.projectSavings({ age, retirementAge, savings, monthlySaving, extraReturn });
    near(r.capitalToday, capital);
    near(r.monthlyIncome, income);
    assert.equal(r.years, retirementAge - age);
  });
}

test('closing the gap: first reference case with a goal of R60 000 a month', () => {
  const input = { age: 40, retirementAge: 65, savings: 1500000, monthlySaving: 10000, extraReturn: 0.04 };
  const gap = calc.closeGap(input, 60000);
  near(gap.perThousand, 1931.06, 0.01);
  near(gap.savingNeeded, 23160);
  near(gap.extra, 13160);
  assert.equal(gap.extraDisplay, 13200);
  assert.equal(gap.firstAge, 73);
  assert.equal(gap.met, false);
});

test('closing the gap: a goal already met, and one out of reach by 75', () => {
  const input = { age: 40, retirementAge: 65, savings: 1500000, monthlySaving: 10000, extraReturn: 0.04 };
  const met = calc.closeGap(input, 30000);
  assert.equal(met.met, true);
  assert.equal(met.extra, 0);
  assert.equal(met.firstAge, 65);
  assert.equal(calc.closeGap(input, 500000).firstAge, null);
});

test('chart series', () => {
  const input = { age: 40, retirementAge: 65, savings: 1500000, monthlySaving: 10000, extraReturn: 0.04 };
  const byAge = calc.incomeByRetirementAge(input);
  assert.equal(byAge[0].age, 55);
  assert.equal(byAge.at(-1).age, 75);
  near(byAge.find((p) => p.age === 65).value, 34589);
  // starts at the visitor's age plus one when that is above 55
  assert.equal(calc.incomeByRetirementAge({ ...input, age: 60 })[0].age, 61);

  const overTime = calc.savingsOverTime(input);
  assert.equal(overTime.length, 26);
  assert.equal(overTime[0].age, 40);
  near(overTime[0].value, 1500000);
  near(overTime.at(-1).value, 8647280);
});

test('rand parsing and formatting', () => {
  assert.equal(calc.parseRand('R1 500 000'), 1500000);
  assert.equal(calc.parseRand('1,500,000'), 1500000);
  assert.equal(calc.parseRand('1500000.75'), 1500000);
  assert.equal(calc.parseRand(''), null);
  assert.equal(calc.parseRand('abc'), null);
  assert.equal(calc.parseRand('0'), 0);
  assert.equal(calc.formatRand(1464013).replace(/ /g, ' '), 'R1 464 013');
  assert.equal(calc.formatRandShort(20000), 'R20k');
  assert.equal(calc.formatRandShort(1200000), 'R1.2m');
  assert.equal(calc.roundTo(34589, 100), 34600);
  assert.equal(calc.roundTo(8647280, 10000), 8650000);
  assert.equal(calc.returnInWords(4), 'Inflation plus 4% a year');
  assert.equal(calc.returnInWords(0), 'Inflation only');
});

// age, savings, income, other, slider, runs out at (null = never), left at 100 in today's money,
// first-year rate %, guide %, income that lasts (null = not shown)
const drawdownCases = [
  [65, 8000000, 40000, 0, 0.04, 90, 0, 6.0, 4.8, 33523],
  [65, 8000000, 32000, 0, 0.04, null, 1345096, 4.8, 4.8, null],
  [70, 5000000, 35000, 10000, 0.03, 92, 0, 6.0, 5.3, 30287],
  [60, 10000000, 60000, 0, 0.04, 79, 0, 7.2, 4.5, 39415],
];

for (const [age, savings, monthlyIncome, otherIncome, extraReturn, runsOut, left, rate, guide, lasts] of drawdownCases) {
  test(`income calculator: age ${age}, R${savings} saved, R${monthlyIncome} a month, R${otherIncome} other`, () => {
    const input = { age, savings, monthlyIncome, otherIncome, extraReturn };
    const r = calc.projectDrawdown(input);
    assert.equal(r.runOutAge, runsOut);
    near(r.leftAt100Today, left);
    near(r.firstYearRate, rate, 1e-9);
    assert.equal(r.guideRate, guide);
    assert.equal(r.covered, false);
    assert.equal(r.points[0].age, age);
    assert.equal(r.points.at(-1).age, 100);
    near(r.points[0].value, savings);
    if (lasts !== null) {
      const income = calc.incomeThatLasts(input);
      near(income, lasts);
      // just below it lasts, just above it runs out
      assert.equal(calc.projectDrawdown({ ...input, monthlyIncome: income - 1 }).runOutAge, null);
      assert.notEqual(calc.projectDrawdown({ ...input, monthlyIncome: income + 1 }).runOutAge, null);
    }
  });
}

test('income calculator: other income that covers the income wanted', () => {
  const r = calc.projectDrawdown({ age: 65, savings: 3000000, monthlyIncome: 20000, otherIncome: 25000, extraReturn: 0.04 });
  assert.equal(r.covered, true);
  assert.equal(r.runOutAge, null);
  assert.equal(r.firstYearRate, 0);
  assert.ok(r.leftAt100Today > 3000000); // untouched savings grow ahead of inflation
});

test('income calculator: display rounding helpers', () => {
  assert.equal(calc.floorTo(33523, 100), 33500);
  assert.equal(calc.roundTo(1345096, 10000), 1350000);
});

test('the "how this is worked out" sentence follows the slider', () => {
  assert.equal(calc.returnSentence(4), 'Inflation is assumed to be 5% a year, so inflation plus 4% means 9% a year.');
  assert.equal(calc.returnSentence(2.5), 'Inflation is assumed to be 5% a year, so inflation plus 2.5% means 7.5% a year.');
  assert.equal(calc.returnSentence(0), 'Inflation is assumed to be 5% a year, so inflation only means 5% a year.');
});

test('savings calculator: figures before inflation is taken off', () => {
  // the case checked three ways on 19 November 2026
  const r = calc.projectSavings({ age: 41, retirementAge: 65, savings: 2700000, monthlySaving: 38000, extraReturn: 0.04 });
  near(r.capitalToday, 23859550);
  near(r.monthlyIncome, 95438);
  near(r.capitalFuture, 76949434);
  near(r.monthlyIncomeFuture, 76949434 * 0.048 / 12);
  // future rands are today's money grown by inflation for the years to retirement
  near(r.capitalFuture, r.capitalToday * Math.pow(1.05, 24), 0.01);
  near(r.monthlyIncomeFuture, r.monthlyIncome * Math.pow(1.05, 24), 0.01);
});
