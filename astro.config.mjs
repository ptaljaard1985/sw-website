// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://simplewealth.co.za',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('contact-success'),
    }),
  ],
});
