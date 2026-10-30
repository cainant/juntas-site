import type { APIRoute } from 'astro';
import { PAGINAS_NO_SITEMAP, SITE } from '../lib/paginas';

export const GET: APIRoute = () => {
  const urls = PAGINAS_NO_SITEMAP.map((c) => `  <url><loc>${SITE}${c}</loc></url>`).join('\n');
  const corpo = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(corpo, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
