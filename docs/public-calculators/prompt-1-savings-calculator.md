# Prompt 1 of 2: Tools section and the retirement savings calculator

Paste everything below the line into the website agent, in the `sw-website` repo.

---

I want two simple public calculators on simplewealth.co.za. This is the first of two tasks: the shared groundwork and the first calculator. A second task adds the second calculator afterwards, so build the shared pieces to be reused.

Read `CLAUDE.md` first and follow its key rules. Work on a branch and open a pull request. Do not push to `main`: it publishes the live site, and I must approve all wording first.

## Background

I use two detailed planning tools with clients in meetings. They live in another repo and you do not need them. These public calculators are much simpler versions for visitors: a few inputs, one clear answer, and an invitation to book a call. Everything you need, including the maths, is in this prompt.

Decisions already made, do not reopen them:

- Built as normal Astro pages, in this site's colours and fonts, but laid out like my meeting tool (see "Look and behaviour"). Not an embed, no iframe.
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

**Expected return slider** (always visible, below the inputs, not hidden in a collapsed section):

A slider labelled "Expected return", running from "inflation" (left end) to "inflation plus 5%" (right end), in steps of 0.5%. Default: inflation plus 4%. The label beside the slider shows the current setting in words, for example "Inflation plus 4% a year". It is a real `<input type="range">`, keyboard usable, with an `aria-valuetext` that reads the same words, and a thumb large enough for a phone.

**Background assumptions (not inputs, the visitor cannot change them):**

- Inflation is 5% a year.
- The visitor's monthly saving rises with inflation each year (5%).

So the growth rate used in the maths is 5% plus the slider value: 5% a year at the left end, 10% at the right end, 9% at the default. Keep inflation as one named constant in `calculators.js`, shared by both calculators. State both background assumptions in "How this is worked out". Use these values as given. I will confirm them at review.

The result updates as the visitor types (no submit button needed), once age, retirement age and at least one of the two money fields are filled in. Rand inputs format with spaces as thousands separators while typing (R1 500 000) and accept pasted numbers with spaces or commas.

**Results:**

1. The headline: the monthly income at the planned retirement age, in today's money, before tax (R34 600 in the first reference case). It sits in the navy answer panel described under "Look and behaviour". Round displayed income to the nearest R100 and capital to the nearest R10 000. Put the results in an `aria-live="polite"` region.
2. Supporting figures in the answer panel's ruled list: savings at retirement in today's money, years until retirement, and the goal rows when a goal was entered.
3. Two chart views, switched by the segmented control. The default: monthly income (today's money) for every retirement age from 55 (or the visitor's age plus one, if that is higher) to 75, with the planned age marked and the goal line if a goal was entered. The second: savings in today's money at each age from now to the planned retirement age. Inline SVG, responsive, readable on a phone, each with a visually hidden table of the same figures for screen readers.
4. If a goal was entered and the result is below it, a "Closing the gap" card with two plain statements: how much more to save each month to reach the goal at the planned age, and the first retirement age (up to 75) at which the current saving reaches it. If no age up to 75 reaches it, say so plainly. If the result meets the goal, say that instead.
5. "What this leaves out": a short plain list. Tax on the income. Investment and advice fees (the expected return is before fees unless the visitor lowers it). Markets do not grow in a straight line. It treats all savings as one pot.
6. "How this is worked out": two or three sentences. Savings grow monthly at the expected return you chose (inflation is assumed to be 5% a year, so inflation plus 4% means 9%). Your monthly saving rises with inflation once a year. The total is brought back to today's money using inflation. The income applies a withdrawal rate that depends on the age you retire (4.8% a year at 65, lower if you retire earlier, higher if later), divided by twelve.
7. Disclaimer, always visible under the results, wording for my review: "This calculator gives a general illustration based on the figures and assumptions you enter. It is not financial advice and does not take your personal circumstances into account. Actual results will differ. Simple Wealth (Pty) Ltd is an authorised financial services provider, FSP no. 50637."
8. `CtaSection` with a heading and text that follow from the tool (for example heading "Want a plan built on your real numbers", text about a free 10-minute call).

## Look and behaviour (follow this closely)

The calculator should look and work like the planning tool I use in client meetings, set in this website's colours and fonts. That tool reads like a printed private-client statement, not a web app. You cannot see it, so here is its design. Use only the site's existing `--color-*` and `--font-*` variables. Add no fonts.

**Page frame.** The normal site header, a `.hero--short` hero with the title and one sentence, then the calculator, then the testimonials, call-to-action and footer. The calculator section has the light grey background (`--color-light-bg`) and holds one white "sheet" (max-width about 1100px, centred, the site's card shadow, square corners). Everything from the inputs to the disclaimer sits on that sheet.

**Order on the sheet:**

1. **Your details**: the input fields in a compact grid (two or three across on desktop, one per row on a phone), then the expected return slider on its own full-width row.
2. **The cover row**, two columns on desktop (about 40% and 60%), stacked on a phone with the panel first:
   - Left, the **answer panel**: solid navy (`--color-navy`), white text, generous padding, no rounded corners. A small label ("Monthly income if you retire at 65"), then the headline figure, very large (about 4.5rem on desktop, 3rem on a phone) in the heading font. Under it one line in muted white ("In today's money, before tax, drawing 4.8% a year"). Then a ruled list of label and value rows, separated by thin lines: Your goal, Against the goal (the percentage, in gold), Goal first reached (the age, or "Not by age 75"), Savings at retirement, Years to retirement. Leave the three goal rows out when no goal was entered.
   - Right, the **chart**: a small heading that names the view, a two-option segmented control ("Income by retirement age" and "Savings over time"), and the chart.
3. **A solid gold rule** across the full width of the sheet, 6px high (`--color-gold`).
4. **Numbered sections**, each with a thin top rule and a number in gold beside its heading (01, 02, 03), numbered with CSS counters so a hidden section is skipped: Closing the gap (only with a goal not yet met), What this leaves out, How this is worked out. Then the disclaimer in small muted text.

**Before the visitor has entered anything**, the answer panel shows a dash in place of the figure and one line saying what to fill in, and the chart area shows a dashed outline with a short note. No sample figures.

**Type.** Headings and the big figures in `--font-heading`, everything else in `--font-body`. Figures use `font-variant-numeric: lining-nums tabular-nums` so digits line up (check this works with the site's self-hosted font files, and tell me if the figures look uneven). Labels in sentence case, never letter-spaced capitals.

**Colour.** Navy for the answer panel and selected states only. Gold for rules, the chart's goal line and accents, and for text only on navy. Do not use gold for small text on white (it is too faint to read): use `--color-text` or `--color-text-light` there. No gradients except the chart's soft area fill. No shadow except the sheet's. Every text pair must reach a contrast of 4.5 to 1.

**Controls.** Text inputs with a clear 1px border, the "R" shown inside the field as a prefix, 4px corners, at least 44px high. The slider is a thin 2px rail with a round navy thumb, inside a touch area at least 44px high, with its current value in words above the rail and the two end labels ("Inflation", "Inflation plus 5%") below it. The segmented control is a boxed pair of options, the selected one filled navy with white text. No filled buttons in the calculator: the only button is the gold one in the site's call-to-action below.

**Charts** (inline SVG, drawn by `calculators.js`):

- "Income by retirement age": a navy line 2.5px thick with a very light navy area fill under it, thin light grey horizontal gridlines, a solid dark baseline, small axis labels in `--color-text-light` (ages along the bottom, rands up the side, shortened as R20k, R40k). The planned retirement age is a navy dot ringed in white, labelled "R34 600 at 65" in the heading font. The goal, if entered, is a dashed gold horizontal line labelled "Goal R60 000".
- "Savings over time": the same style, savings in today's money at each age from now to the planned retirement age, with the end point marked and labelled.
- Hovering over or tapping a point shows that point's age and figure. The chart must also be readable without hovering.

**How it behaves.** Everything updates at once as the visitor types or drags the slider (no "Calculate" button, no page jump, no layout shift when figures change length). The headline figure may ease to its new value over about 200ms, switched off under `prefers-reduced-motion`. On a phone the answer panel stays directly under the inputs so the visitor sees the figure change as they adjust.

## The maths (implement exactly)

```
inflation  = 0.05 (fixed)
growth     = inflation + slider value (0 to 0.05)
escalation = inflation
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

| Age | Retire | Savings | Monthly | Expected return | Savings at retirement, today's money | Monthly income |
|---|---|---|---|---|---|---|
| 40 | 65 | 1 500 000 | 10 000 | inflation plus 4% | 8 647 280 | 34 589 |
| 50 | 60 | 4 000 000 | 25 000 | inflation plus 4% | 9 351 668 | 35 069 |
| 30 | 67 | 0 | 5 000 | inflation plus 5% | 5 757 938 | 23 991 |
| 45 | 65 | 2 000 000 | 8 000 | inflation | 3 870 107 | 15 480 |
| 58 | 70 | 8 000 000 | 0 | inflation plus 3% | 11 217 691 | 49 545 |

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
