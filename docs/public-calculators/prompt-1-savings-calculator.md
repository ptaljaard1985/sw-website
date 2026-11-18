# Prompt 1 of 2: Tools section and the retirement savings calculator

Paste everything below the line into the website agent, in the `sw-website` repo.

---

I want two simple public calculators on simplewealth.co.za. This is the first of two tasks: the shared groundwork and the first calculator. A second task adds the second calculator afterwards, so build the shared pieces to be reused.

Read `CLAUDE.md` first and follow its key rules. Work on a branch and open a pull request. Do not push to `main`: it publishes the live site, and I must approve all wording first.

## Background

I use two detailed planning tools with clients in meetings. They live in another repo and you do not need them. These public calculators are much simpler versions for visitors: a few inputs, one clear answer, and an invitation to book a call. Everything you need, including the maths, is in this prompt.

Decisions already made, do not reopen them:

- Built as normal Astro pages in this site's own design (navy, gold, Cormorant Garamond, Inter). Not an embed, no iframe.
- Before tax. No tax tables anywhere.
- Open to everyone. No email gate, no form submission. Nothing a visitor types may leave the browser: no network calls, no localStorage, no cookies, no figures in analytics.
- A new "Tools" item in the main menu. This is the explicit request that rule 4 in `CLAUDE.md` asks for.
- No new dependencies and no outside scripts. The security header in `netlify.toml` blocks them, and it must not be loosened. Draw charts as inline SVG with vanilla JS.

## What to build

### 1. Menu

In `src/components/Header.astro`, add "Tools" linking to `/tools/`, between "What we believe" and "Knowledge", in both the desktop and the mobile menu, with `activePage === 'tools'` highlighting. Check the desktop menu still fits on one line at 1024px and 1280px wide. If it does not, tell me and suggest a fix instead of shrinking the type on your own. Add "Tools" to the footer's Company column too.

### 2. Tools page: `src/pages/tools/index.astro`

Short `.hero--short` hero, then two cards (reuse the existing card styles), one per calculator, each with a line icon (inline Lucide SVG), a one-sentence description and a descriptively worded link. The second card links to `/tools/retirement-income-calculator/`, which the next task builds. Until then, show that card as "Coming soon" with no link. Then `TestimonialsCarousel` and `CtaSection`.

### 3. Shared calculator files

- `public/calculators.css`: all calculator styles. Load it only on the tools pages, through the `head` slot of `BaseLayout`, so other pages stay as fast as they are. Use the existing `--color-*` and `--font-*` variables only.
- `public/calculators.js`: the maths as pure functions with no DOM access, plus small shared helpers (rand formatting, input parsing, the SVG chart drawing). Load it with `is:inline` through the `scripts` slot. Make the pure functions usable from Node as well (attach to `window.SWCalc` in the browser, `module.exports` when that exists) so they can be tested.
- `tests/calculators.test.mjs`: a plain Node test file (built-in `node:test` and `node:assert`, no packages) that checks the reference figures below. Add `"test": "node --test tests/"` to `package.json`.

### 4. Calculator page: `src/pages/tools/retirement-savings-calculator.astro`

Title on the page: "Retirement savings calculator". It answers: at this rate of saving, what monthly income could my savings pay me when I retire, in today's money.

**Inputs** (large, labelled, usable on a phone):

| Input | Default | Limits |
|---|---|---|
| Your age | 45 | 18 to 74 |
| Age you plan to retire | 65 | 55 to 75, and above your age |
| Retirement savings today (all pots together) | empty | R0 or more |
| What you save each month | empty | R0 or more |
| Monthly income you would like in retirement, in today's money (optional) | empty | |

Under a collapsed "Change the assumptions" control:

| Assumption | Default | Limits |
|---|---|---|
| Growth a year | 9% | 0% to 15% |
| Inflation a year | 5% | 2% to 10% |
| Your monthly saving rises each year by | 5% | 0% to 12% |

Use these three defaults as given. Do not choose different ones. I will confirm them at review.

The result updates as the visitor types (no submit button needed), once age, retirement age and at least one of the two money fields are filled in. Rand inputs format with spaces as thousands separators while typing (R1 500 000) and accept pasted numbers with spaces or commas.

**Results:**

1. The headline: the monthly income at the planned retirement age, in today's money, before tax. For example "About R34 600 a month at 65, in today's money, before tax." Round displayed income to the nearest R100 and capital to the nearest R10 000. Put the results in an `aria-live="polite"` region.
2. Two supporting figures: savings at retirement in today's money, and years until retirement.
3. A chart: monthly income (today's money) for every retirement age from 55 (or the visitor's age plus one, if that is higher) to 75, as a line or bars, with the planned age marked. If a goal was entered, draw it as a horizontal line. Inline SVG, responsive, readable on a phone, with a visually hidden table of the same figures for screen readers.
4. If a goal was entered and the result is below it, a "Closing the gap" card with two plain statements: how much more to save each month to reach the goal at the planned age, and the first retirement age (up to 75) at which the current saving reaches it. If no age up to 75 reaches it, say so plainly. If the result meets the goal, say that instead.
5. "What this leaves out": a short plain list. Tax on the income. Investment and advice fees (the growth figure is before fees unless the visitor lowers it). Markets do not grow in a straight line. It treats all savings as one pot.
6. "How this is worked out": two or three sentences. Savings grow monthly at the growth rate. Monthly saving rises once a year. The total is brought back to today's money using inflation. The income applies a withdrawal rate that depends on the age you retire (4.8% a year at 65, lower if you retire earlier, higher if later), divided by twelve.
7. Disclaimer, always visible under the results, wording for my review: "This calculator gives a general illustration based on the figures and assumptions you enter. It is not financial advice and does not take your personal circumstances into account. Actual results will differ. Simple Wealth (Pty) Ltd is an authorised financial services provider, FSP no. 50637."
8. `CtaSection` with a heading and text that follow from the tool (for example heading "Want a plan built on your real numbers", text about a free 10-minute call).

## The maths (implement exactly)

```
years   = max(1, retirementAge - age)
rMonth  = (1 + growth)^(1/12) - 1
balance = savings ; contrib = monthlySaving
for each year 1..years:
    repeat 12 times:  balance = balance * (1 + rMonth) + contrib
    contrib = contrib * (1 + escalation)
capitalToday  = balance / (1 + inflation)^years
monthlyIncome = capitalToday * withdrawalRate(retirementAge) / 12
```

`withdrawalRate(age)`, in percent a year, by age at retirement (round the age to a whole number):

```
55: 4.2, 56: 4.3, 57: 4.3, 58: 4.4, 59: 4.4, 60: 4.5, 61: 4.6, 62: 4.6,
63: 4.7, 64: 4.7, 65: 4.8, 66: 4.9, 67: 5.0, 68: 5.1, 69: 5.2, 70: 5.3,
71: 5.5, 72: 5.7, 73: 5.8, 74: 6.0, 75: 6.2, 76: 6.5, 77: 6.7, 78: 7.0,
79: 7.2, 80: 7.5, 81: 8.0, 82: 8.5, 83: 9.0, 84: 9.5, 85: 10.0, 86: 10.7,
87: 11.4, 88: 12.1, 89: 12.8, 90: 13.5, 91: 14.4, 92: 15.3, 93: 16.2,
94: 17.1, 95: 18.0, 96: 19.4, 97: 20.8, 98: 22.2, 99: 23.6, 100: 25.0
below 55: max(3.5, 4.2 - 0.1 * (55 - age)) ; above 100: 25.0
```

Put the whole table in `calculators.js` (the second calculator uses ages up to 100).

Closing the gap: income is a straight line in the monthly saving, so run the projection at a saving of R0 and of R1 000, take the difference as the income each extra R1 000 a month buys, and solve for the saving that reaches the goal. Round the extra saving up to the next R100 for display. For the age, step the retirement age up one year at a time to 75.

**Reference figures for the tests** (exact engine output, before display rounding; allow a R1 tolerance):

| Age | Retire | Savings | Monthly | Growth | Inflation | Rises | Savings at retirement, today's money | Monthly income |
|---|---|---|---|---|---|---|---|---|
| 40 | 65 | 1 500 000 | 10 000 | 9% | 5% | 5% | 8 647 280 | 34 589 |
| 50 | 60 | 4 000 000 | 25 000 | 9% | 5% | 5% | 9 351 668 | 35 069 |
| 30 | 67 | 0 | 5 000 | 10% | 6% | 6% | 4 604 611 | 19 186 |
| 58 | 70 | 8 000 000 | 0 | 8% | 5% | 5% | 11 217 691 | 49 545 |

For the first row with a goal of R60 000 a month: each extra R1 000 a month buys R1 931.06 of monthly income, the saving needed is R23 160 a month in total (R13 160 more, shown as R13 200), and the first retirement age that reaches the goal on the current saving is 73.

## Wording rules for everything a visitor reads

Plain English, South African spelling, warm and direct, as on the rest of the site. No em dashes (use brackets for asides), no exclamation marks, no rhetorical questions, no marketing language. Rand amounts with spaces (R1 464 013), percentages like 7.5%. Never name a product, fund or provider. Never say or imply the result is advice, a forecast or a promise: it "could" pay, it is "an illustration". Real copy everywhere, no placeholder text.

## Also

- SEO: title and description on each page. JSON-LD through the `schema` prop: `WebApplication` (applicationCategory `FinanceApplication`, free, provider by `@id` to `https://simplewealth.co.za/#organization`) plus `BreadcrumbList` on the calculator, `CollectionPage` on `/tools/`. Add the pages to `public/llms.txt`.
- Accessibility: every input labelled, keyboard usable, visible focus, error messages tied to their inputs, any animation switched off under `prefers-reduced-motion`.
- Analytics: at most one Plausible custom event named "Calculator used" with the calculator's name, sent once per visit, and only if the Plausible script already on the site supports custom events without changing the security header. Never send any figure a visitor typed.
- Update `CLAUDE.md`: file structure, navigation, URL list, and a short "Calculators" section stating the rules (before tax, nothing leaves the browser, no dependencies, the withdrawal table is shared with the meeting tools and must match them).
- Only touch the files this task needs.

## Before you open the pull request

Run `npm test` and `npm run build`. Open the three pages in the built site at phone (375px), tablet (768px) and desktop widths and take screenshots for the pull request. Check the browser console is free of errors and security-header warnings. In the pull request, list every piece of visitor-facing wording you wrote so I can review it in one place, and state anything you were unsure about.
