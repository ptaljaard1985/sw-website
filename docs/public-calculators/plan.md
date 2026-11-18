# Public calculators on simplewealth.co.za: plan

18 November 2026. Decisions marked (Pierre) were made on that date.

## What we are building

Two simplified, public versions of the meeting tools in the CRM repo (`tools/accumulation/` and `tools/drawdown/`), built as ordinary pages of the Astro website. They are new, small pages written for the public. The meeting tools themselves are not published, embedded or changed.

| | Meeting tool (CRM) | Public tool (website) |
|---|---|---|
| Saving | Building capital: two spouses, four pots, step-ups, capital events, scenarios, reports, CRM import | **Retirement savings calculator**: one household figure, five inputs, one answer |
| Drawing | Drawing income: living annuities, SARS tax, CGT, draw order, goals, events, reports | **Retirement income calculator**: one pot, an income, how long it lasts |

## Decisions

1. **Rebuild, do not embed.** The meeting tools are 430 to 530 KB single files in a different look, built for an adviser with a client. The public tools are written fresh in the website's own design, with only the core maths carried across.
2. **Both tools are before tax** (Pierre). No tax tables on the website, so nothing to update each February. Tax is named as something the tool leaves out.
3. **Open to everyone, no email gate** (Pierre). Nothing a visitor types leaves their browser. Each result ends with an invitation to book a free call.
4. **A new "Tools" item in the main menu** (Pierre), between "What we believe" and "Knowledge", leading to a page listing both calculators.
5. **Charts are drawn by the page itself (inline SVG).** The site's security header blocks outside scripts, so the meeting tools' chart library cannot load. No new dependency.
6. **Expected return is a slider, from inflation to inflation plus 5%** (Pierre). Inflation is fixed at 5% a year in the background and is not an input. Monthly saving is assumed to rise with inflation.
7. **Illustration, never advice.** Each page shows its assumptions, says what it leaves out, and carries the FSP statement. No product or fund is named.

## Pages

| URL | Purpose |
|---|---|
| `/tools/` | Lists the two calculators |
| `/tools/retirement-savings-calculator/` | What your savings could pay you a month in retirement |
| `/tools/retirement-income-calculator/` | How long your savings last at the income you want |

## The maths

**Retirement savings calculator.** The same engine as the meeting tool with one person and one pot: monthly compounding, contributions rising once a year, the result brought back to today's money, then the meeting tool's age-based withdrawal schedule (4.8% at 65) divided by twelve. Checked on 18 November 2026 against the meeting tool's own `project()` on four cases: identical to the rand.

**Retirement income calculator.** A deliberately plain version: one pot, an income that rises with inflation, drawn at the start of each year, the rest growing for the year, to age 100. It does not reproduce the meeting tool's figures (that tool is after tax and applies the living annuity limits). It borrows only the year convention and the withdrawal schedule, which is shown as a guide beside the visitor's own draw rate.

Reference figures for both are in the prompts, so the website agent can test against them.

## For Pierre to confirm before anything goes live

1. **Two background choices I made**: the slider starts at inflation plus 4% (a starting point on a public page is a compliance choice), and monthly saving rises with inflation each year, with no separate input for it.
2. **All wording on the three pages**, including the "what this leaves out" notes and the disclaimer. The agent drafts. Nothing merges to `main` (which publishes the site) without your sign-off.
3. **The menu at laptop width** once "Tools" is added (six items plus the button).

## Order of work

1. Prompt 1: the shared groundwork (menu, Tools page, calculator styles and script, tests) and the retirement savings calculator. Pull request, your review, merge.
2. Prompt 2: the retirement income calculator, on top of prompt 1. Pull request, your review, merge.

## Upkeep

- The withdrawal schedule now lives in three places: both meeting tools and the website's `public/calculators.js`. If it changes in the meeting tools, change the website too.
- No tax tables, so no February update.
- Later, if wanted: a line in each meeting tool's notes pointing at the public version, an article per calculator, a link from the newsletter.
