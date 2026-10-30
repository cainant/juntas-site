import type { APIRoute } from 'astro';
import { SITE } from '../lib/paginas';

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *
Allow: /
Disallow: /enxoval/

Sitemap: ${SITE}sitemap.xml
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
