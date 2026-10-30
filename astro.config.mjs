import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  site: 'https://juntas.app.br',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // OUT_DIR deixa o teste ponta a ponta construir fora de dist/.
  outDir: process.env.OUT_DIR || './dist',
  integrations: [preact()],
  security: {
    // Gera a <meta> de CSP com os hashes dos scripts e estilos que o Astro emite
    // (inclusive o script de hidratação da ilha do enxoval). As páginas do enxoval
    // acrescentam o connect-src pela API de runtime (Astro.csp).
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ],
    },
  },
});
