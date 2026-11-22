const fs = require('fs');
const path = require('path');

const pagesData = require('../src/data/pagesContent.json');
const blogsData = require('../src/data/blogs.json');

const today = new Date().toISOString().split('T')[0];

const urlMap = new Map();

function addUrl(loc, priority = '0.7', changefreq = 'monthly', lastmod = today) {
  const cleanLoc = loc.trim();
  if (!cleanLoc || urlMap.has(cleanLoc)) return;
  urlMap.set(cleanLoc, { loc: cleanLoc, priority, changefreq, lastmod });
}

// 1. Homepage
addUrl('https://www.sksinfi.com/', '1.0', 'weekly');

// 2. High-value categories priority map
const highPriority = new Set([
  'loan', 'real_estate', 'investment', 'insurance', 'sksinfi_nri',
  'home_loan', 'personal-loan', 'business-loan', 'residential',
  'commercial', 'industrial', 'mutual_funds', 'health', 'life',
  'taxation', 'itr', 'about', 'contact', 'msme'
]);

// 3. Dedicated clean routes (NEVER include redirecting routes like 'sksinfin')
const dedicatedCleanRoutes = [
  'about', 'contact', 'blogs', 'calculator', 'partner-with-us',
  'careers', 'enquirynow', 'msme'
];

for (const route of dedicatedCleanRoutes) {
  addUrl(
    `https://www.sksinfi.com/${route}`,
    route === 'about' || route === 'contact' || route === 'msme' ? '0.8' : '0.7',
    highPriority.has(route) ? 'weekly' : 'monthly'
  );
}

// 4. HTML Sitemap URL
addUrl('https://www.sksinfi.com/sitemap.html', '0.6', 'monthly');

// 5. Add all standard pages from pagesContent.json (clean URLs only, no .php duplicates, no redirecting sksinfin)
for (const [rawSlug, data] of Object.entries(pagesData)) {
  const slug = rawSlug.trim().replace(/\.php$/, '');
  if (!slug || slug === 'index' || slug === 'sksinfin') continue;
  if (slug === 'sitemap' || slug === 'sitemap.html') {
    addUrl('https://www.sksinfi.com/sitemap.html', '0.6', 'monthly');
    continue;
  }

  const priority = highPriority.has(slug) ? '0.8' : '0.6';
  const changefreq = highPriority.has(slug) ? 'weekly' : 'monthly';

  addUrl(`https://www.sksinfi.com/${slug}`, priority, changefreq);
}

// 6. Add all active blogs from blogs.json
if (Array.isArray(blogsData)) {
  for (const blog of blogsData) {
    if (blog && blog.slug) {
      const cleanBlogSlug = blog.slug.trim();
      addUrl(
        `https://www.sksinfi.com/blogs/${cleanBlogSlug}`,
        '0.8',
        'weekly',
        blog.publishedAt ? blog.publishedAt.split('T')[0] : today
      );
    }
  }
}

const urls = Array.from(urlMap.values());

// Generate XML
const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const outPath = path.resolve('public/sitemap.xml');
fs.writeFileSync(outPath, xmlContent, 'utf-8');
console.log('Successfully generated public/sitemap.xml with', urls.length, 'clean canonical URLs.');
