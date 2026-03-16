# Simple Wealth — Project Context for Claude Code

## What this project is
A financial advisory website for **Simple Wealth**, a South Africa-based independent financial planning firm. The site targets affluent professionals aged 45–65 who need wealth management, investment, tax, estate, and protection planning services.

The site is replacing the current Webflow site at simplewealth.co.za. Built with **Astro** for templating and content collections, outputting static HTML. No client-side frameworks — just vanilla CSS and JS.

---

## Tech stack
- **Astro 6** — static site generator (outputs pure HTML, no JS runtime)
- **CSS:** one global stylesheet (`public/styles.css`) — no Tailwind, no Bootstrap
- **JS:** one global script (`public/script.js`) — vanilla JS only, loaded with `is:inline`. Supports multiple carousel instances via `querySelectorAll`.
- Mobile-first responsive design (breakpoints: 768px, 480px)
- Semantic HTML throughout
- **Hosting:** Netlify (free tier) — forms handled via Netlify Forms. Auto-deploys from GitHub on push to `main`
- **Repo:** https://github.com/ptaljaard1985/sw-website.git
- **Staging URL:** new.simplewealth.co.za (CNAME → Netlify)
- **Schema.org structured data** on all pages (JSON-LD, passed via layout `schema` prop)
- **Images:** all stored locally in `public/images/` (no external image dependencies)
- **Articles:** Markdown files in `src/content/articles/` using Astro content collections

### Astro docs reference
- LLM-friendly docs: https://docs.astro.build/llms.txt and https://docs.astro.build/llms-full.txt
- Full docs: https://docs.astro.build

---

## File structure
```
astro.config.mjs                  # Astro config (site URL)
package.json                      # Dependencies
tsconfig.json                     # TypeScript config

src/
├── components/
│   ├── Header.astro              # Shared navigation (activePage prop for highlighting)
│   ├── Footer.astro              # Shared footer (showSocial prop)
│   ├── CtaSection.astro          # Reusable CTA block (heading/text props)
│   └── TestimonialsCarousel.astro # Google reviews carousel (grey prop, default true)
├── layouts/
│   ├── BaseLayout.astro          # Base page wrapper (head, fonts, schema, header, footer)
│   └── ArticleLayout.astro       # Article template (hero, progress bar, author bio, share)
├── content/
│   └── articles/                 # Markdown article files
│       ├── cash-vs-invest.md
│       ├── reduce-tax-bill.md
│       ├── retirement-income.md
│       ├── income-protection.md
│       ├── markets-fall.md
│       └── review-your-will.md
├── pages/
│   ├── index.astro               # Homepage
│   ├── investment-planning.astro  # Service page
│   ├── risk-planning.astro        # Service page
│   ├── estate-planning.astro      # Service page
│   ├── tax-planning.astro         # Service page
│   ├── about-us.astro             # Team page
│   ├── about-you.astro            # Ideal client page
│   ├── contact.astro              # Book a discovery call (Netlify form)
│   ├── contact-success.astro      # Form submission thank-you page
│   ├── knowledge-and-insight.astro # Editorial hub / article listing
│   └── articles/
│       └── [...id].astro          # Dynamic article route

public/
├── styles.css                    # Global stylesheet
├── script.js                     # Global JS — nav, FAQ, carousel, animations
├── logo.png                      # Company logo (400x120px optimised)
├── logo large.png                # Original high-res logo (5906x1772px)
├── sitemap.xml                   # XML sitemap
├── robots.txt                    # Robots file pointing to sitemap
└── images/                       # All site images (local)
```

---

## How the Astro components work

### BaseLayout.astro
Wraps every page. Props: `title`, `description`, `activePage`, `showSocialInFooter`, `schema`.
- Renders `<head>` (meta, fonts, CSS, schema JSON-LD)
- Includes Header and Footer components
- Named slots: `head` (extra head content), `before-nav` (e.g. reading progress bar), `scripts` (page-specific JS)
- Global script loaded via `<script src="/script.js" is:inline>`

### Header.astro
Shared navigation. Prop: `activePage` (string) — used to add `.active` class.
- Desktop nav with dropdown for services (keyboard accessible: Enter/Space to toggle, Escape to close)
- Dropdown trigger has `role="button"`, `tabindex="0"`, `aria-expanded`, `aria-haspopup="true"`; menu has `role="menu"`; links have `role="menuitem"`
- Mobile hamburger menu with `aria-expanded`, `aria-controls="mobile-nav"`; mobile nav has `id="mobile-nav"`, `aria-hidden`
- All internal links use `/slug/` format (not `.html`)

### Footer.astro
Shared footer. Prop: `showSocial` (boolean) — toggles LinkedIn/website icons. Copyright year is dynamic (`new Date().getFullYear()`).

### CtaSection.astro
Reusable navy CTA block. Props: `heading`, `text` (both have defaults). Has decorative route SVG motif via `::after` (same as `.hero--short`).

### TestimonialsCarousel.astro
Reusable Google reviews carousel with 20 real client reviews (Lene Botha excluded). Props:
- `grey` (boolean, default `true`) — controls whether section has grey background
- Reviews are shuffled (Fisher-Yates) on each page load via `public/script.js`
- Shows Google rating badge (5.0 from 22 reviews) linking to Google Maps listing
- Responsive: 3 cards on desktop, 2 on tablet, 1 on mobile
- Auto-advances every 5 seconds
- Used on all pages except contact — pass `grey={false}` when surrounded by grey sections (index, about-you)

### ArticleLayout.astro
Wraps article content. Accepts all article frontmatter props + `slug`.
- Reading progress bar, article hero with image/overlay, author bio, share row
- `<slot />` receives rendered markdown content
- Parses `date` prop ("Month Year") into ISO format for schema `datePublished` and `dateModified`

### Content collections
Articles are `.md` files in `src/content/articles/`. Frontmatter schema:
```yaml
title: string (required)
description: string (required)
category: string (required)
image: string (required) — path like "/images/article-cash-vs-invest.jpg"
imageAlt: string (required)
date: string (required) — e.g. "March 2025"
author: string (default: "Pierre Taljaard")
authorTitle: string (default: "Certified Financial Planner")
authorPhoto: string (default: "/images/avatar-james-hartley.jpg")
authorBio: string (default: "Pierre has over 15 years...")
```

### Adding a new article
1. Create a `.md` file in `src/content/articles/` with the frontmatter above
2. Write article body in markdown (supports `## headings`, `> blockquotes`, `**bold**`, etc.)
3. The page auto-generates at `/articles/{filename}/`
4. The Knowledge & Insight page auto-generates article cards from the collection (sorted by date descending) — no manual card needed

---

## Brand

**Company:** Simple Wealth
**Founder:** Pierre Taljaard, Certified Financial Planner
**Tagline:** "Make your wealth work harder so you don't have to"
**Domain:** simplewealth.co.za
**Email:** info@simplewealth.co.za
**Phone:** 087 012 5628
**Address:** Office 7.17, Workshop17, 7th Floor, Ballito Junction Regional Mall, Leonora Dr, Ballito, 4399
**Google Maps:** https://maps.app.goo.gl/z5PbmNjmUYrW6vDD7
**LinkedIn:** https://www.linkedin.com/in/ptaljaard/
**Personal site:** https://www.pierretaljaard.com/
**Tone:** Professional, warm, plain English — no financial jargon. Think FT Weekend editorial, not fintech startup.

---

## Design system

### Colors (CSS custom properties)
```css
--color-navy: #152D47;
--color-navy-light: #1e3a5a;
--color-gold: #CD8F5E;
--color-gold-hover: #b87d4e;
--color-white: #ffffff;
--color-light-bg: #f8f9fa;
--color-text: #333333;
--color-text-light: #666666;
--color-text-muted: #999999;
--color-border: #e2e5e9;
```

### Typography
- **Headings:** Cormorant Garamond (Google Fonts) — weights 300, 400, 500, 600, 700, italic
- **Body / UI:** Inter (Google Fonts) — weights 300, 400, 500, 600
- Google Fonts link:
```
https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap
```

### CSS font variables
```css
--font-heading: 'Cormorant Garamond', serif;
--font-body: 'Inter', sans-serif;
```

### Heading sizing
Cormorant Garamond is optically smaller than most fonts — sizes are set larger to compensate:
- h1: ~3.6rem
- h2: ~2.6rem
- h3: ~1.65rem
- Inner page heroes (`.hero--short`) have 20% wider text than homepage (h1: 672px, p: 576px vs homepage h1: 560px, p: 480px)

### Heading styles
```css
h1, h2, h3, h4 {
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.15;
}
```

### Cormorant italic — use for pull quotes, testimonials, hero taglines
```css
.hero-tagline,
.testimonial-quote,
.pull-quote {
  font-style: italic;
  font-weight: 300;
}
```

---

## Visual language — CRITICAL

This site targets 45–65 year old affluent professionals making high-trust financial decisions.

**DO use:**
- Real photography (stored locally in `public/images/`)
- Hero gradient overlay (left-to-right): `rgba(10,22,40,1) 0% → 0.6 at 50% → 0.15 at 65% → 0.05 at 80%`
- Decorative route SVG motif (dashed path with waypoints and destination pin) on `.hero--short` and `.cta-section` via `::after` pseudo-element — gold (#CD8F5E), 50% opacity, hidden on mobile ≤480px
- `.hero-highlight` class: gold curved underline swoosh on a key word in hero h1 (used on homepage "clarity")
- Simple line icons (inline SVGs from Lucide icon set — no CDN dependency)
- Clean, generous whitespace
- Subtle card shadows: `box-shadow: 0 2px 16px rgba(0,0,0,0.07)`
- Gold accent (#CD8F5E) for CTAs, tags, borders, highlights
- Section alternating backgrounds: white and #f8f9fa

**DO NOT use:**
- Cartoon or Undraw-style illustrations — ever
- Bright or playful color schemes
- Dense layouts
- Lorem ipsum placeholder text — always use real copy
- Generic template language

---

## Photography

All images are stored locally in `public/images/`. No external image dependencies.

| Location | File |
|---|---|
| Hero | images/hero-adviser.jpg (iStock 1441254475 — multigenerational family dinner, flipped horizontally) |
| Investment planning | images/service-investment.jpg (iStock 848840496 — magnifying glass on growth charts) |
| Tax planning | images/service-tax.jpg (iStock 1222021819 — reviewing financials with calculator) |
| Risk planning | images/service-risk.jpg (iStock 1199060494 — hands protecting paper-cut family) |
| Estate planning | images/service-estate.jpg (iStock 2199281061 — signing Last Will and Testament) |
| Article: cash vs invest | images/article-cash-vs-invest.jpg |
| Article: reduce tax | images/article-reduce-tax.jpg |
| Article: retirement | images/article-retirement.jpg |
| Article: protection | images/article-protection.jpg |
| Article: markets fall | images/article-markets-fall.jpg |
| Article: review will | images/article-review-will.jpg |

### Avatars
- Hero social proof uses gold-star-in-navy-circle initials (no photos)
- Old testimonial avatar photos are no longer used on any page
- `images/avatar-james-hartley.jpg` — Pierre Taljaard (author bio on articles)

### Image CSS rules
```css
img {
  object-fit: cover;
  width: 100%;
  display: block;
  background-color: var(--color-navy); /* fallback */
}
```

### Image performance
- Hero images and nav logo: eager loading (above the fold)
- All other images: `loading="lazy"`
- Logo: 400x120px PNG, ~17KB (resized from 5906px original)

---

## Logo

- **Nav:** 64px height, white filter on transparent nav, original colors when scrolled
- **Footer:** 38px height, white filter (navy background)
- CSS filter for white: `filter: brightness(0) invert(1)`
- Original high-res file: `logo large.png` (keep this — used for regenerating optimised versions)

---

## Navigation structure
```
Logo (left) — links to /
How we help ▾
  - Invest smarter → /investment-planning/
  - Protect your future → /risk-planning/
  - Plan your legacy → /estate-planning/
  - Pay less tax → /tax-planning/
About you → /about-you/
About us → /about-us/
Knowledge → /knowledge-and-insight/
[Book your free discovery call] → /contact/  ← CTA button, gold background
```

- Navigation is defined once in `src/components/Header.astro`
- Sticky on scroll, mobile hamburger menu
- Active page highlighted via `activePage` prop

---

## URL structure
All internal links use trailing-slash format:
- `/` (homepage)
- `/investment-planning/`, `/risk-planning/`, `/estate-planning/`, `/tax-planning/`
- `/about-us/`, `/about-you/`
- `/contact/`, `/contact-success/`
- `/knowledge-and-insight/`
- `/articles/{slug}/` (dynamic from content collection)

---

## Homepage sections (in order)
1. Navigation (Header component)
2. Hero — headline ("Financial clarity for the life you've built" with gold swoosh on "clarity"), subheading, dual CTA ("How we help" is white bg/gold text), trust badges, 5 gold-star circles, "5.0 star rated" links to #testimonials
3. Problem — 4 pain point cards with icons
4. Solution — 4 benefit cards with CTA (grey background)
5. Testimonials — TestimonialsCarousel component (white background, `grey={false}`)
6. Services — 4 service cards with photos (order: Investment, Tax, Risk, Estate) (grey background)
7. Why choose us — 4 numbered reasons
8. 3-step process — Discovery call, Family meeting, Review assessment
9. What you get — 3 document cards
10. FAQ accordion — 5 questions with JS expand/collapse
11. Final CTA — CtaSection component
12. Footer (Footer component)

---

## Services
| Service | Headline | Page |
|---|---|---|
| Investment planning | A strategy that grows your wealth over time | /investment-planning/ |
| Risk planning | A plan for the unexpected | /risk-planning/ |
| Estate planning | Thoughtful planning, lasting security | /estate-planning/ |
| Tax planning | Keep more, invest smarter | /tax-planning/ |

---

## Knowledge & Insight page
Article cards are auto-generated from the `articles` content collection via `getCollection('articles')`, sorted by date descending. Displayed in a 3-column grid (2 on tablet, 1 on mobile). Each links to `/articles/{slug}/`.

Newsletter signup form (AJAX with error handling) — will be replaced with Mailerlite embed (pending embed code from Pierre).

---

## Forms

### Contact form (contact.astro)
- Handled by **Netlify Forms** (`data-netlify="true"`, name="contact")
- Honeypot spam protection via `data-netlify-honeypot="bot-field"` + hidden field
- Form validation styles: `:focus:invalid` (red border), `:focus:valid` (gold border)
- Redirects to `/contact-success/` on submission
- Fields: name, email, phone, age, location, service (select), message
- Right sidebar: contact details card (email, phone, office address, response time) + Google Maps embed (responsive height via `.contact-map` class)

### Newsletter form (knowledge-and-insight.astro)
- Currently Netlify Forms (`data-netlify="true"`, name="newsletter")
- To be replaced with **Mailerlite** embed (pending embed code)
- AJAX submission with inline thank-you message on success, error message on failure

---

## Article page features
Every article page (generated from markdown via ArticleLayout) includes:
- Full-width hero image with dark overlay and overlaid headline
- Category tag (gold, uppercase)
- Author: Pierre Taljaard, Certified Financial Planner
- Estimated read time (calculated dynamically via JS at 200 words/minute)
- Reading progress bar (3px gold, fixed top, fills on scroll — vanilla JS)
- Article body: max-width 720px centered column
- Blockquote styling: 3px gold left border, Cormorant italic
- Author bio card below article
- Share row: LinkedIn, Twitter/X, Copy link (clipboard JS)
- Related articles: 3 cards linking to other articles
- Final CTA section: navy, "Book your free discovery call"

---

## Schema.org structured data
All pages have JSON-LD structured data (passed via BaseLayout `schema` prop):
- **Homepage:** FinancialService (full business info), WebSite, FAQPage
- **Service pages:** Service with FinancialService provider
- **About us:** AboutPage with FinancialService entity
- **About you:** WebPage
- **Contact:** ContactPage with address/email
- **Knowledge & Insight:** CollectionPage
- **Contact success:** WebPage
- **Articles:** Article with author, publisher, image, datePublished, dateModified

---

## Footer
Defined once in `src/components/Footer.astro`:
```
Logo (image)
Address: Office 7.17, Workshop17, 7th Floor, Ballito Junction Regional Mall, Leonora Dr, Ballito, 4399 (linked to Google Maps)
Email: info@simplewealth.co.za (mailto link)
Social: LinkedIn, pierretaljaard.com (toggled via showSocial prop)
Nav links (mirroring header)
Legal: Conflict of Interest | Anti-Slavery | Complaints | Privacy Policy | Terms of Service | Cookie Settings
© {current year} Simple Wealth. All rights reserved. (dynamic via JS Date)
```

---

## Build & development

### Commands
```bash
npm run dev       # Start dev server at http://localhost:4321
npm run build     # Build to dist/ (static HTML)
npm run preview   # Preview built output locally
```

### Netlify deployment
- Build command: `npm run build`
- Publish directory: `dist`
- Netlify Forms work automatically with `data-netlify="true"` in static HTML output
- Auto-deploys on push to `main` branch via GitHub integration
- Staging: `new.simplewealth.co.za` (CNAME to `aquamarine-pie-06e3b3.netlify.app`)
- DNS managed at Afrihost (simplewealth.co.za)

---

## SEO & performance
- Schema.org JSON-LD on all pages (including datePublished on articles, WebPage on contact-success)
- sitemap.xml with all pages
- robots.txt pointing to sitemap
- All images local (no third-party dependencies except Google Fonts)
- Lazy loading on below-fold images
- Logo optimised: 400x120px, ~17KB
- Google Fonts with `display=swap`
- Astro outputs zero client-side framework JS
- `@media (prefers-reduced-motion: reduce)` disables animations, hover transforms, and smooth scroll

---

## Outstanding work
1. Purchase unwatermarked iStock images (hero: 1441254475, investment: 848840496, tax: 1222021819, risk: 1199060494, estate: 2199281061)
2. Replace article stock images with better ones
3. Wire up related articles in ArticleLayout to link to actual article pages
4. Replace Netlify newsletter form with Mailerlite embed (pending embed code)
5. Add Pierre's real headshot (replace avatar-james-hartley.jpg)
6. Add analytics (e.g. Fathom, as used on current Webflow site)
7. Create or link legal pages (Privacy Policy, Terms, etc.)
8. ~~Add netlify.toml config file~~ ✓ Done
9. Connect custom domain (simplewealth.co.za) when ready to replace Webflow

---

## Key rules — always follow these
1. Never use lorem ipsum — all copy must be real and purposeful
2. Never use cartoon illustrations or Undraw SVGs
3. Use CSS custom properties for colors — never hardcode hex values (use `--color-*` variables)
4. Never change navigation structure without being explicitly asked
5. When making targeted changes, only touch the files specified — do not "improve" other files
6. All buttons use gold (#CD8F5E) background with navy (#152D47) text
7. Sections alternate between white and #f8f9fa backgrounds
8. Header and Footer are shared components — edit them once, not per-page
9. Mobile hamburger menu must work on all pages
10. All images must be stored locally in `public/images/`
11. Use `loading="lazy"` on below-fold images, eager for hero/nav logo
12. All internal links use `/slug/` format with trailing slash — never `.html`
13. Scripts referencing `public/` assets must use `is:inline` directive
14. Article content goes in `src/content/articles/` as `.md` files — never as `.astro` pages
15. Reference Astro docs at https://docs.astro.build/llms-full.txt when unsure about Astro APIs
16. Prefer CSS classes over inline styles — use utility classes (`.cards-grid--centered`, `.card--centered`, `.contact-grid--narrow`, `.visually-hidden`) where appropriate
17. All interactive elements must be keyboard accessible with proper ARIA attributes
18. Respect `prefers-reduced-motion` — all new animations must be disabled in the reduced-motion media query
