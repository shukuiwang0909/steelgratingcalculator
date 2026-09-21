import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://steelgratingcalculator.com',
  integrations: [
    sitemap({
      // Thin conversion pages must not be indexed
      filter: (page) => !page.includes('/inquiry/thanks/') && !page.includes('/404'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
