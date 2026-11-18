# Prompt 2 of 2: the retirement income calculator

Use this only after the pull request from prompt 1 has been merged. Paste everything below the line into the website agent, in the `sw-website` repo.

---

The site now has a Tools section with a retirement savings calculator (see the "Calculators" section in `CLAUDE.md`, `public/calculators.js`, `public/calculators.css`, `tests/calculators.test.mjs` and `src/pages/tools/`). Add the second calculator, reusing those shared pieces. Match the first calculator's layout, components and tone so the two read as a pair.

Read `CLAUDE.md` first and follow its rules. Work on a branch and open a pull request. Do not push to `main`: it publishes the live site, and I must approve all wording first.

The same decisions hold, do not reopen them: normal Astro page in the site's design, before tax with no tax tables, open to everyone, nothing a visitor types leaves the browser (no network calls, no storage, no figures in analytics), no new dependencies, inline SVG charts, security header unchanged.

## What to build

### Page: `src/pages/tools/retirement-income-calculator.astro`

Title on the page: "Retirement income calculator". It is for someone at or near retirement. It answers: if I draw this income from my savings, how long do they last.

**Inputs:**

| Input | Default | Limits |
|---|---|---|
| Your age | 65 | 55 to 90 |
| Your savings today (all pots together) | empty | above R0 |
| Monthly income you want, in today's money, before tax | empty | above R0 |
| Other monthly income, such as a pension or rent (optional) | empty | R0 or more |

Under a collapsed "Change the assumptions" control:

| Assumption | Default | Limits |
|---|---|---|
| Growth a year | 9% | 0% to 15% |
| Inflation a year | 5% | 2% to 10% |

Use these defaults as given. The result updates as the visitor types, once age, savings and income are filled in. Same rand input behaviour as the first calculator.

**Results:**

1. The headline, one of two forms. Either "At R40 000 a month, your savings could last until about age 90." or "At R32 000 a month, your savings could last beyond age 100." In the second case add what would be left at 100 in today's money. Put the results in an `aria-live="polite"` region. Round displayed income to the nearest R100 and capital to the nearest R10 000.
2. The draw rate, stated plainly beside the guide: "You would be drawing 6.0% of your savings in the first year. A commonly used guide at age 65 is about 4.8%." Use neutral wording when the rate is at or below the guide, and a plain caution when it is above. No red alarm styling: a gold accent is enough.
3. The income that lasts: "An income of about R33 500 a month could last to age 100." (This figure includes the other income.) Show it only when the chosen income runs out before 100.
4. A chart: savings in today's money at each age from now to 100, as an area or line, with the run-out age marked if there is one. Inline SVG, responsive, with a visually hidden table of the same figures.
5. "What this leaves out": Tax on the income. Investment and advice fees. Markets do not grow in a straight line, and poor returns early in retirement matter more than the average. Living annuities have legal limits on how much may be drawn each year (between 2.5% and 17.5%), which this ignores. It treats all savings as one pot. Other income is assumed to rise with inflation.
6. "How this is worked out": two or three sentences. The income you want, less any other income, is taken from your savings at the start of each year and rises with inflation. What remains grows at the growth rate. The calculation runs to age 100.
7. The same disclaimer as the first calculator, word for word.
8. `CtaSection`, with a heading and text that follow from this tool.

Also: make the second card on `/tools/` live (remove "Coming soon"), and add a short cross-link on each calculator to the other one ("Still saving" on this page, "Already retired or close to it" on the first).

## The maths (implement exactly)

Add pure functions to `public/calculators.js`, using the withdrawal table already there.

```
need0   = max(0, monthlyIncome - otherIncome) * 12
balance = savings
runOutAge = none
for age from currentAge to 99:
    y    = age - currentAge
    need = need0 * (1 + inflation)^y
    record balance / (1 + inflation)^y          (the chart point for this age)
    if balance < need and runOutAge is none:  runOutAge = age
    draw    = min(balance, need)
    balance = (balance - draw) * (1 + growth)
leftAt100Today  = balance / (1 + inflation)^(100 - currentAge)
firstYearRate   = need0 / savings
guideRate       = withdrawalRate(currentAge)
```

`runOutAge` is the first age at which the savings cannot pay the full year's income. "Lasts beyond 100" means no such age.

The income that lasts: the highest monthly income (including other income) for which there is no run-out age. Find it by bisection between other income and other income plus savings / 12, 60 steps, and round down to the nearest R100 for display.

If other income covers the income wanted, say so plainly ("Your other income already covers this") and show the savings growing untouched.

**Reference figures for the tests** (exact engine output, before display rounding):

| Age | Savings | Income | Other | Growth | Inflation | Runs out at | Left at 100, today's money | First-year rate | Guide | Income that lasts |
|---|---|---|---|---|---|---|---|---|---|---|
| 65 | 8 000 000 | 40 000 | 0 | 9% | 5% | 90 | 0 | 6.00% | 4.8% | 33 523 |
| 65 | 8 000 000 | 32 000 | 0 | 9% | 5% | never | 1 345 096 | 4.80% | 4.8% | (not shown) |
| 70 | 5 000 000 | 35 000 | 10 000 | 8% | 5% | 92 | 0 | 6.00% | 5.3% | 30 287 |
| 60 | 10 000 000 | 60 000 | 0 | 9% | 5% | 79 | 0 | 7.20% | 4.5% | 39 415 |

Allow R1 on the rand figures. Add these to `tests/calculators.test.mjs`.

## Wording rules for everything a visitor reads

Plain English, South African spelling, warm and direct. No em dashes (use brackets for asides), no exclamation marks, no rhetorical questions, no marketing language. Rand amounts with spaces, percentages like 7.5%. Never name a product, fund or provider. Never say or imply the result is advice, a forecast or a promise. Take particular care here: this reader may be anxious about running out of money, so state results calmly and factually, and never tell them what they should do.

## Also

- SEO and JSON-LD as on the first calculator (`WebApplication` plus `BreadcrumbList`). Add the page to `public/llms.txt`.
- Accessibility as on the first calculator.
- Analytics: the same single "Calculator used" event if prompt 1 added one, with this calculator's name. Never any figure.
- Update the "Calculators" section and lists in `CLAUDE.md`.
- Only touch the files this task needs. Do not restyle or rework the first calculator beyond the cross-link.

## Before you open the pull request

Run `npm test` and `npm run build`. Open `/tools/` and both calculators in the built site at phone (375px), tablet (768px) and desktop widths and take screenshots for the pull request. Check the console is free of errors and security-header warnings. In the pull request, list every piece of visitor-facing wording you wrote so I can review it in one place, and state anything you were unsure about.
