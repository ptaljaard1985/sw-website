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
astro.config.mjs                  # Astro config (site URL, trailingSlash, sitemap integration)
package.json                      # Dependencies
tsconfig.json                     # TypeScript config
netlify.toml                      # Netlify config (build, functions, security headers)

netlify/
└── functions/
    └── subscribe.js              # Serverless function — proxies forms to MailerLite API (origin check, honeypot, email validation)

src/
├── components/
│   ├── Header.astro              # Shared navigation (activePage prop for highlighting)
│   ├── Footer.astro              # Shared footer (showSocial prop)
│   ├── CtaSection.astro          # Reusable CTA block (heading/text props)
│   ├── TestimonialsCarousel.astro # Google reviews carousel (grey prop, default true)
│   └── LeadMagnet.astro          # Lead magnet section (grey prop, default true)
├── layouts/
│   ├── BaseLayout.astro          # Base page wrapper (head, fonts, schema, header, footer)
│   └── ArticleLayout.astro       # Article template (hero, progress bar, author bio, share)
├── content/
│   ├── content.config.ts         # Content collection schema (authorPhoto default here)
│   └── articles/                 # Markdown article files (13 articles from HUM)
│       ├── what-game-are-you-playing.md
│       ├── financial-fortress.md
│       ├── two-constant-temptations.md
│       ├── better-questions.md
│       ├── know-your-numbers.md
│       ├── your-financial-levers.md
│       ├── longevity-risk.md
│       ├── unknowns.md
│       ├── how-many-good-summers.md
│       ├── contributions-heavy-lifting.md
│       ├── temperament-tactics.md
│       ├── left-out.md
│       └── uncomfortable-number.md
├── pages/
│   ├── index.astro               # Homepage
│   ├── investment-planning.astro  # Service page
│   ├── risk-planning.astro        # Service page
│   ├── estate-planning.astro      # Service page
│   ├── tax-planning.astro         # Service page
│   ├── about-us.astro             # Team page
│   ├── about-you.astro            # Ideal client page
│   ├── contact.astro              # Book a free call (Netlify form)
│   ├── contact-success.astro      # Form submission thank-you page (no nav/footer)
│   ├── knowledge-and-insight.astro # Editorial hub / article listing
│   └── articles/
│       └── [...id].astro          # Dynamic article route

public/
├── styles.css                    # Global stylesheet
├── script.js                     # Global JS — nav, FAQ, carousel, animations
├── logo.png                      # Company logo (400x120px optimised)
├── logo large.png                # Original high-res logo (5906x1772px)
├── favicon.ico                   # Favicon (ICO format)
├── favicon.svg                   # Favicon (SVG format)
├── robots.txt                    # Robots file pointing to sitemap + llms.txt
├── llms.txt                      # AI crawler context (company info, services, articles, philosophy)
├── documents/                    # Compliance PDFs (POPI, Conflict of Interest, Complaints)
└── images/                       # All site images (local)
```

---

## How the Astro components work

### BaseLayout.astro
Wraps every page. Props: `title`, `description`, `activePage`, `showSocialInFooter`, `schema`, `hideNav`, `hideFooter`, `ogImage`, `ogType`.
- Renders `<head>` (meta, fonts, CSS, schema JSON-LD, canonical URL, Open Graph, Twitter Card, favicon)
- Includes Header and Footer components (can be hidden via `hideNav`/`hideFooter` boolean props — used on contact-success page)
- Named slots: `head` (extra head content), `before-nav` (e.g. reading progress bar), `scripts` (page-specific JS)
- Global script loaded via `<script src="/script.js" is:inline>`

### Header.astro
Shared navigation. Prop: `activePage` (string) — used to add `.active` class.
- Desktop nav with dropdown for services (opens on hover at 1024px+ with 150ms close delay, also keyboard accessible: Enter/Space to toggle, Escape to close)
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

### LeadMagnet.astro
Reusable lead magnet section ("Successful Investing In Pictures" guide download). Props:
- `grey` (boolean, default `true`) — controls section background
- Name + email form fields submitted via JS fetch to `/.netlify/functions/subscribe`
- Subscriber added to MailerLite with SIIP group (triggers guide delivery automation)
- Inline success/error messages (no page redirect)
- Used on homepage (grey) and about-us page (grey)
- Guide cover image: `/images/leadmagnet.webp`

### ArticleLayout.astro
Wraps article content. Accepts all article frontmatter props + `slug`.
- Reading progress bar, article hero with image/overlay, author bio
- Related articles section: 3 cards (same category first, then others, excluding current)
- `<slot />` receives rendered markdown content
- Parses `date` prop ("Month Year") into ISO format for schema `datePublished` and `dateModified`
- Passes `ogImage` and `ogType="article"` to BaseLayout for correct social sharing
- Adds `article:published_time` and `article:author` OG meta tags
- BreadcrumbList schema (Home > Knowledge & Insight > Article Title)

### Content collections
Articles are `.md` files in `src/content/articles/`. Frontmatter schema:
```yaml
title: string (required)
description: string (required)
category: string (required)
image: string (required) — path like "/images/article-game.webp"
imageAlt: string (required)
date: string (required) — e.g. "March 2025"
author: string (default: "Pierre Taljaard")
authorTitle: string (default: "Certified Financial Planner")
authorPhoto: string (default: "/images/headshot-pierre.webp") — central default in content.config.ts
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
**Tagline:** "Independent financial planning for the life you've built"
**Domain:** simplewealth.co.za
**Email:** info@simplewealth.co.za
**Phone:** 087 012 5628
**Address:** Office 7.17, Workshop17, 7th Floor, Ballito Junction Regional Mall, Leonora Dr, Ballito, KwaZulu-Natal, 4399
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
- **Headings:** Cormorant Garamond (Google Fonts) — weights 500, 600, 700, italic 300, 400
- **Body / UI:** Inter (Google Fonts) — weights 400, 500, 600
- Google Fonts link:
```
https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,300;1,400&family=Inter:wght@400;500;600&display=swap
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
- Decorative route SVG motif (dashed path with waypoints and destination pin) on `.hero--short` and `.cta-section` via `::after` pseudo-element — gold (#CD8F5E), 50% opacity, hidden on mobile ≤480px. Positioned at `bottom: 10%` with `max-height: 60%` to prevent overflow into nav on shorter heroes.
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
| Hero | images/hero-adviser.webp (iStock 1441254475 — multigenerational family dinner, 1200px) |
| Investment planning | images/service-investment.webp (iStock 848840496 — magnifying glass, 1200px) |
| Tax planning | images/service-tax.webp (iStock 1222021819 — reviewing financials, 1200px) |
| Risk planning | images/service-risk.webp (iStock 1199060494 — hands protecting family, 1200px) |
| Estate planning | images/service-estate.webp (iStock 2199281061 — signing will, 1200px) |
| Articles | One unique abstract image per article (see "Article images" section below) |
| Lead magnet cover | images/leadmagnet.webp (800px) |
| Pierre headshot | images/headshot-pierre.webp (400px) |

### Article images
Each article has a unique abstract image sourced from **Pawel Czerwinski on Unsplash** (free, commercial use, no attribution required). The visual style is dark, moody, fluid abstract textures in navy/gold/warm tones that match the brand palette.

**When creating a new article:**
1. Search Unsplash for a Pawel Czerwinski abstract image that loosely matches the article's theme/mood
2. Download at L size (~2000px wide), resize to 800px wide, convert to WebP (quality 80)
3. Save to `public/images/` with naming convention `article-{short-slug}.webp`
4. Set `image` and `imageAlt` in the article frontmatter

**Current article image assignments:**
| Article | Image file | Style |
|---|---|---|
| Asking Better Questions | article-better-questions.webp | Blue/white fluid swirls |
| Contributions Do the Heavy Lifting | article-contributions.webp | Blue/brown/gold fluid |
| Your Financial Fortress | article-fortress.webp | Blue/black dense painting |
| How Many Good Summers | article-good-summers.webp | Orange/gold/black fluid |
| Know Your Numbers | article-know-numbers.webp | Blue/black sharp patterns |
| The Courage to Feel Left Out | article-left-out.webp | Blue wave on black |
| Longevity Risk | article-longevity.webp | Black with flowing lines |
| Temperament Trumps Tactics | article-temperament.webp | Dark flowing fabric |
| Two Constant Temptations | article-temptations.webp | Red/blue fluid |
| The Uncomfortable Number | article-uncomfortable.webp | Red/black waves |
| Building Wealth for Unknowns | article-unknowns.webp | Blue/white on dark |
| What Game Are You Playing? | article-game.webp | Black/gold curves |
| Understanding Your Financial Levers | article-levers.webp | Dark sepia curves |

**Photographer:** Pawel Czerwinski — https://unsplash.com/@pawel_czerwinski

### Avatars & headshot
- Hero social proof uses gold-star-in-navy-circle initials (no photos)
- Old testimonial avatar photos are no longer used on any page
- `images/headshot-pierre.webp` — Pierre Taljaard (400px, author bio on articles + about-us page). Central default set in `src/content.config.ts`

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
  - Pay less tax → /tax-planning/
  - Protect your future → /risk-planning/
  - Plan your legacy → /estate-planning/
About you → /about-you/
About us → /about-us/
Knowledge → /knowledge-and-insight/
[Book your free free call] → /contact/  ← CTA button, gold background
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
8. How we work with you — steps 1–3 (bordered card) with dashed arrow down to step 4 (Annual service calendar, centered). Desktop-only arrows.
9. What you get — 3 document cards
10. Lead magnet — LeadMagnet component (grey background)
11. FAQ accordion — 5 questions with JS expand/collapse (white background)
12. Final CTA — CtaSection component
13. Footer (Footer component)

---

## Services
| Service | Headline | Page |
|---|---|---|
| Investment planning | Make your investments work for you | /investment-planning/ |
| Tax planning | A smarter approach to tax | /tax-planning/ |
| Risk planning | A plan for when life doesn't go to plan | /risk-planning/ |
| Estate planning | Plan your legacy with clarity and care | /estate-planning/ |

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
- Fields (all required, with custom validation messages via inline JS):
  - name, email, phone, age, location, service (select), investable assets (select: Less than R2m, R2m–R10m, R10m–R30m, R30m–R50m, R50m+), current financial adviser (select: yes/no/it's complicated), how did you hear about us (select), message
  - Required checkbox: "I understand that for investable assets less than R2m, our minimum annual fee may not be cost-effective."
- Right sidebar: contact details card (email, phone, office address, response time) + Google Maps embed (responsive height via `.contact-map` class, sandboxed iframe)

### Lead magnet form (LeadMagnet.astro)
- Submits via JS fetch to `/.netlify/functions/subscribe` (Netlify serverless function)
- Function adds subscriber to MailerLite via API (email + name + SIIP group)
- MailerLite API key stored as `MAILERLITE_API_KEY` environment variable in Netlify (never in code)
- MailerLite group ID `84731331148252747` (SIIP) triggers guide delivery automation
- Honeypot field (`website`) for bot protection — checked server-side
- Inline success message on submit; no page redirect

### Newsletter form (knowledge-and-insight.astro)
- Submits via JS fetch to `/.netlify/functions/subscribe` with `group: 'newsletter'`
- MailerLite group ID `84731160014357766` (newsletter)
- Honeypot field (`website`) for bot protection — checked server-side
- AJAX submission with inline thank-you message on success, error message on failure

### Subscribe serverless function (netlify/functions/subscribe.js)
- Origin whitelist: only accepts requests from `simplewealth.co.za` and `new.simplewealth.co.za`
- CORS headers returned on all responses
- Honeypot check: silently accepts if `website` field is filled (bot trap)
- Server-side email validation: regex + 254-char limit
- Name length limit: 200 chars
- Group selector: whitelist lookup (`siip` or `newsletter`), defaults to `siip`

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
- Related articles: 3 cards linking to other articles
- Final CTA section: navy, "Book your free call"

---

## Schema.org structured data
All pages have JSON-LD structured data (passed via BaseLayout `schema` prop).
Homepage FinancialService has `@id: "https://simplewealth.co.za/#organization"` — all other pages reference it via `@id`.

- **Homepage:** FinancialService (full business info with `@id`, `image`), WebSite, FAQPage
- **Service pages:** Service (with `url`, `provider` via `@id`) + BreadcrumbList + FAQPage (all 4 pages)
- **About us:** AboutPage (via `@id`) + Person schema for Pierre (credentials, image, LinkedIn)
- **About you:** WebPage (via `@id`)
- **Contact:** ContactPage (via `@id`)
- **Knowledge & Insight:** CollectionPage (via `@id`) with ItemList of all articles
- **Contact success:** WebPage (via `@id`, `noindex`)
- **Articles:** Article (absolute image URL, datePublished, author, publisher via `@id`) + BreadcrumbList + `article:published_time` OG meta

---

## Footer
Defined once in `src/components/Footer.astro`:
```
Logo (image)
Brand description
FSP statement: "Simple Wealth (Pty) Ltd is an authorised financial services provider. FSP no. 50637"
Nav columns: How we help, Company, Get in touch (address, email)
Legal links: Google Maps | POPI Statement | Conflict of Interest Management Policy | Complaints Resolution Policy
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

### Security headers (netlify.toml)
All pages served with:
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` — enforces HTTPS
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — restricts browser features
- `Content-Security-Policy` — restricts script/style/font/frame sources to self + Google Fonts + Google Maps

---

## SEO, AIO & performance
- Schema.org JSON-LD on all pages with `@id` entity linking across the site
- Homepage FinancialService schema includes: `@id`, `image`, `founder` with CFP/CFA credentials, `hasCredential` with FSP 50637, `areaServed` array (South Africa, KwaZulu-Natal, Ballito, Umhlali), `knowsAbout` with regional search terms
- Service page schemas include `url`, `provider` via `@id`, `areaServed`, BreadcrumbList
- About Us includes Person schema for Pierre (credentials, image, LinkedIn)
- Knowledge & Insight includes ItemList of all articles
- Article pages include BreadcrumbList and `article:published_time` OG meta
- `lang="en-ZA"` for South African regional targeting
- `og:locale` = `en_ZA` on all pages
- Canonical URLs on all pages via `<link rel="canonical">` (derived from `Astro.url`)
- Open Graph and Twitter Card meta tags on all pages (articles pass their own `ogImage` and `ogType="article"`)
- `llms.txt` in public root for AI crawler discoverability (company, credentials, services, philosophy, all 13 articles)
- `robots.txt` references `sitemap-index.xml` and `llms.txt`
- Sitemap auto-generated by `@astrojs/sitemap` integration (contact-success excluded via filter)
- `trailingSlash: 'always'` in Astro config for URL consistency
- `contact-success` page has `<meta name="robots" content="noindex">`
- All images in WebP format with `width`/`height` attributes (prevents CLS)
- Cache-Control headers: images/documents 1 year immutable, CSS/JS 1 day
- Favicon: both `favicon.ico` and `favicon.svg` linked in BaseLayout
- All images local (no third-party dependencies except Google Fonts)
- Lazy loading on below-fold images; eager for hero/nav logo
- Google Fonts trimmed to 6 weights with `display=swap`
- Astro outputs zero client-side framework JS
- `@media (prefers-reduced-motion: reduce)` disables animations, hover transforms, and smooth scroll
- Nav logo has `fetchpriority="high"` (Lighthouse identified it as mobile LCP element)

### Mobile performance — optimisation log (March 2026)
Current mobile PageSpeed: **97 Performance**, FCP 0.9s, LCP 2.0s, Speed Index 4.1s, CLS 0 (Moto G Power, slow 4G).
Desktop: **100 Performance**, FCP/LCP 0.5s, Speed Index 0.8s.
Accessibility 96, Best Practices 100, SEO 100 (both mobile and desktop).

**What worked:**
1. **Self-hosted Google Fonts** (commit 5a5c83e) — downloaded 3 woff2 files (Cormorant Garamond normal + italic, Inter) to `public/fonts/`, added `@font-face` with `font-display: swap` in styles.css, preloaded critical fonts in `<head>`. Eliminated 2 DNS lookups + 4 TLS handshakes to fonts.googleapis.com / fonts.gstatic.com. Mobile performance jumped from 89 to 97, FCP from 2.7s to 1.6s.
2. **`fetchpriority="high"` on nav logo** — Lighthouse identified logo as mobile LCP element.
3. **Descriptive link text on service cards** — fixed SEO audit (generic "Learn more" links), SEO went from 92 to 100.
4. **Logo PNG → WebP** via `<picture>` element (17 KB → 7 KB, 59% smaller). PNG kept as fallback.
5. **Hero mobile image recompressed** (41 KB → 32 KB at q65 — fine under dark gradient overlay).
6. **Plausible preconnect** — reduced critical chain from 721ms to 446ms.

**Things that were tried and reverted:**
1. **Deferred Google Fonts stylesheet** (`<link rel="preload" as="style" onload="...">` swap) — caused CLS regression from 0 to 0.258 because text reflowed when fonts loaded late. Reverted in commit d6db7a8.
2. **`defer` on script.js** — script is already at end of `<body>` and wrapped in `DOMContentLoaded`. Adding `defer` dropped performance from 92 to 90 and regressed Speed Index from 2.7s to 4.3s (more blank frames in filmstrip). Reverted.

**What's still in place:**
- Self-hosted fonts in `public/fonts/` with `@font-face` declarations in styles.css (woff2 only, latin subset)
- Font preloads in BaseLayout `<head>` for above-fold fonts (Cormorant Garamond normal + Inter)
- Logo served as WebP with PNG fallback via `<picture>` (Header + Footer)
- `fetchpriority="high"` on nav logo (LCP element)
- Plausible preconnect in `<head>`
- Hero image eager-loaded with mobile-specific smaller src
- All below-fold images lazy-loaded
- Single CSS file, single JS file, zero framework JS
- CSP: `font-src 'self'` (no external font origins)
- Fonts cached immutably for 1 year via netlify.toml

**Options not yet explored (if further improvement needed):**
- Inline critical CSS (above-the-fold styles in `<style>` tag) and async-load the rest — only remaining lever for the 330ms render-blocking CSS flag, but high risk of regression and maintenance burden
- Reduce CSS file size (currently ~8.7 KiB gzipped — audit for unused rules)

---

## Site review (March 2026)

### Copy issues — UK vs SA terminology (HIGH PRIORITY)
Several pages use UK-specific financial terms that don't apply in South Africa:
- ~~**Tax planning page** — References to "ISA" and "pension allowances" in FAQ. SA uses TFSAs, retirement annuities (RAs), pension/provident funds — not ISAs.~~ ✓ Fixed — full FAQ rewrite with 8 SA-relevant questions, FAQPage schema added
- ~~**Tax planning FAQ** — "inheritance tax" should be "estate duty". "Potentially exempt transfers" is a UK concept.~~ ✓ Fixed — removed all UK terms
- ~~**Estate planning FAQ** — "solicitors" should be "attorneys".~~ ✓ Fixed — full FAQ rewrite with SA terminology
- ~~**Investment planning FAQ** — "pensions" should reference retirement annuities / pension funds.~~ ✓ Fixed — now "retirement funds"
- ~~**Estate planning** — "pensions without nominated beneficiaries" should be "retirement funds".~~ ✓ Fixed — now "beneficiary nominations on policies and investment accounts"
- ~~**About You client stories**~~ ✓ Removed — stories section replaced with "How we work with you" process section. Real case studies to be added later.

### Copy issues — wording
- ~~**Homepage solution section** (`index.astro:101`) — "helps busy professionals to live"~~ ✓ Fixed — now "We help busy families take control of their financial future."
- ~~**Homepage "What you get"** (`index.astro:168`) — "provide clarity...by providing"~~ ✓ Fixed — now "Here's what you can expect from working with us."
- ~~**Homepage process step 1** (`index.astro:152`) — "confirm alignment with expertise"~~ ✓ Fixed — now "A 10-minute call to see if our expertise matches your needs."
- ~~**Investment planning** — approach section intro was formulaic "We make sure..." sentence.~~ ✓ Fixed — rewritten
- ~~**Tax planning** — approach section intro was formulaic "We make sure..." sentence.~~ ✓ Fixed — rewritten
- ~~**Risk planning** — approach section intro was formulaic.~~ ✓ Fixed — rewritten
- ~~**Estate planning** — approach section intro was formulaic "We ensure..." sentence.~~ ✓ Fixed — rewritten
- ~~**Homepage FAQ** (`index.astro:186`) — "fiduciary firm" and "fee-only model excludes commissions"~~ ✓ Fixed — rewritten with Pierre's actual answers, no fiduciary/fee-only claims
- ~~**About Us** (`about-us.astro:74-76`) — Verify "CFA Charterholder" and "CFP Professional"~~ ✓ Confirmed current by Pierre

### Structural / UX issues
- ~~**Footer legal links**~~ ✓ Fixed — updated to Google Maps, POPI Statement, Conflict of Interest Management Policy, Complaints Resolution Policy (linked to PDFs in `public/documents/`).
- ~~**Lead magnet form**~~ ✓ Fixed — now submits to MailerLite via Netlify Function, inline success message, no redirect.
- ~~**No related articles**~~ ✓ Fixed — ArticleLayout shows 3 related articles (same category first).
- ~~**Newsletter form** — AJAX handler posts to `/` not the form action.~~ ✓ Fixed — wired to MailerLite via `/.netlify/functions/subscribe` with honeypot.
- ~~**No favicon** — `BaseLayout.astro` has no `<link rel="icon">`.~~ ✓ Fixed — favicon.ico and favicon.svg linked
- ~~**No canonical URLs** — `BaseLayout.astro` has no `<link rel="canonical">`.~~ ✓ Fixed — canonical + OG + Twitter Card meta tags added
- ~~**Contact page** — Has inline styles~~ ✓ Fixed — replaced with CSS utility classes.

---

## Outstanding work
1. ~~Purchase unwatermarked iStock images~~ ✓ Done — licensed L-size images replaced for hero + all 4 service pages
2. ~~Replace article stock images with better/unique ones~~ ✓ Done — 13 unique abstract images from Pawel Czerwinski (Unsplash), one per article
3. ~~Wire up related articles in ArticleLayout to link to actual article pages~~ ✓ Done — shows 3 related articles per page
4. ~~Replace lead magnet form with MailerLite integration~~ ✓ Done — via Netlify Function + MailerLite API. Newsletter forms also wired to MailerLite (newsletter group).
5. ~~Add Pierre's real headshot~~ ✓ Done — `headshot-pierre.png`, default in `content.config.ts`
6. ~~Add analytics~~ ✓ Done — Plausible Analytics (privacy-friendly, no cookies, GDPR compliant)
7. ~~Link compliance documents in footer~~ ✓ Done — PDFs in `public/documents/`, linked from Footer component
8. ~~Add netlify.toml config file~~ ✓ Done
9. Connect custom domain (simplewealth.co.za) when ready to replace Webflow
10. Verify article content matches original source (humansundermanagement.com) — WebFetch tool paraphrased some articles

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
