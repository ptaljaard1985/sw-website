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
