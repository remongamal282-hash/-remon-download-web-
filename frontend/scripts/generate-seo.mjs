import fs from 'node:fs';
import path from 'node:path';

const siteUrl = (process.env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '');
const publicDir = path.resolve(process.cwd(), 'public');
const sitemapUrlSet = [
  '/',
  '/desktop',
  '/documentation',
  '/about',
].map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`).join('\n');

fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(
  path.join(publicDir, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /login\nDisallow: /register\nDisallow: /history\nDisallow: /favorites\nDisallow: /scheduler\nDisallow: /settings\nDisallow: /downloader\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
  'utf8',
);

fs.writeFileSync(
  path.join(publicDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrlSet}\n</urlset>\n`,
  'utf8',
);
