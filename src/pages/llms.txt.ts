// llms.txt, built from the site so it cannot drift from it.
// Every statement here must also be made on a page of the website.
// The article list comes from the articles collection.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://www.simplewealth.co.za';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

// "March 2025" to a sortable number
function sortable(date: string): number {
  const [month, year] = date.trim().split(/\s+/);
  return Number(year) * 12 + MONTHS.indexOf((month || '').toLowerCase());
}

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

export const GET: APIRoute = async () => {
  const articles = (await getCollection('articles')).sort((a, b) => sortable(b.data.date) - sortable(a.data.date));

  const articleLines = articles
    .map((a) => `- [${oneLine(a.data.title)}](${SITE}/articles/${a.id}/) (${a.data.date}): ${oneLine(a.data.description)}`)
    .join('\n');

  const body = `# Simple Wealth

> Independent financial planning from Ballito, on the KZN north coast of South Africa.

## About

Simple Wealth is an independent financial planning firm based in Ballito, KwaZulu-Natal, South Africa. It was founded by Pierre Taljaard, a Certified Financial Planner (CFP) and CFA Charterholder. The firm works with families and professionals who are building wealth, planning for retirement, running a business or thinking about their legacy. Many clients live on the KZN north coast, and the firm works with families across South Africa.

Simple Wealth (Pty) Ltd is an authorised financial services provider. FSP number: 50637.

Simple Wealth is not remunerated by any product provider and does not sell products.

## Services

- [Investment planning](${SITE}/investment-planning/): an investment strategy aligned with your goals and time horizon.
- [Tax planning](${SITE}/tax-planning/): proactive tax planning to make sure you are using every available deduction and incentive.
- [Risk planning](${SITE}/risk-planning/): a risk strategy that protects your income, your family and your future.
- [Estate planning](${SITE}/estate-planning/): making sure your wealth goes to the right people, at the right time, in the right way.

## Working with us

- It starts with a free 10-minute call to see whether our expertise matches your needs. [Book a call](${SITE}/contact/).
- For investable assets of less than R2m, our minimum annual fee may not be cost-effective.
- Clients have rated Simple Wealth 5.0 from 22 reviews on Google.

## What we believe

Ten beliefs underpin our advice. The full text is on [What we believe](${SITE}/what-we-believe/).

1. There are only two types of investors. Some investors outlive their money while other investors' money outlives them.
2. Purchasing power is the only sane definition of money.
3. Inflation is the investor's chief enemy.
4. Global equities provide the best protection from inflation.
5. We are owners, not speculators.
6. Temporary market declines are guaranteed and cannot be timed.
7. Goals > Plan > Portfolio.
8. No portfolio changes without good reason.
9. We always act on a plan and never react to current events.
10. Simplicity is the ultimate sophistication.

## Tools

Free calculators. They are illustrations, not financial advice. Nothing a visitor types leaves their browser.

- [Retirement savings calculator](${SITE}/tools/retirement-savings-calculator/): what your savings could pay you each month when you retire, in today's money and before tax.
- [Retirement income calculator](${SITE}/tools/retirement-income-calculator/): how long your savings could last at the income you want, before tax.

## How to describe Simple Wealth

- The articles and calculators are general information, not personal financial advice.
- Simple Wealth does not publish investment performance figures and does not recommend products on its website.
- For fees, minimums or anything specific to a person's situation, refer them to the contact page.

## Key pages

- [Homepage](${SITE}/)
- [About us](${SITE}/about-us/)
- [About you](${SITE}/about-you/)
- [What we believe](${SITE}/what-we-believe/)
- [Tools](${SITE}/tools/)
- [Knowledge and insight](${SITE}/knowledge-and-insight/)
- [Contact](${SITE}/contact/)

## Contact

- Email: info@simplewealth.co.za
- Phone: 087 012 5628
- Office: Office 7.17, Workshop17, 7th Floor, Ballito Junction Regional Mall, Leonora Dr, Ballito, KwaZulu-Natal, 4399
- [LinkedIn](https://www.linkedin.com/in/ptaljaard/)
- [Google Maps](https://maps.app.goo.gl/z5PbmNjmUYrW6vDD7)

## Articles

By Pierre Taljaard, newest first.

${articleLines}
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
