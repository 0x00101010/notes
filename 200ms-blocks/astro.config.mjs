import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://0x00101010.github.io',
  base: '/notes/200ms-blocks/',
  integrations: [react()],
});
