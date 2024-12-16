import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://pngtobmp.com', // Replace with your website URL
  integrations: [sitemap()],
});