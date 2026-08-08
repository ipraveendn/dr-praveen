/**
 * Script to generate sitemap.xml with all medicine URLs
 * Run: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import medicines data
const pharmacyCatalog = [
  {
    title: 'Antilipemic Agents',
    items: [
      { name: 'ROSARA 5' },
      { name: 'ROSUPLUS 10' },
      { name: 'ROSUPLUS 20' },
      { name: 'ROSUPLUS F 10/160' },
    ]
  },
  {
    title: 'Anti-hypertensives',
    items: [
      { name: 'OMSARA 20' },
      { name: 'OMSARA CH 20/12.5' },
      { name: 'OMSARA TRIO 20' },
      { name: 'THATAN 20' },
      { name: 'THATAN 40' },
      { name: 'THATAN AM 40/5' },
    ]
  },
  {
    title: 'Weight Loss Medications',
    items: [
      { name: 'FLABCUT 60' },
      { name: 'FLABCUT 120' },
    ]
  },
  {
    title: 'Diabetic Neuropathy',
    items: [
      { name: 'PREGACEP 75' },
      { name: 'PRENARA-SR 75' },
    ]
  },
  {
    title: 'Oral Hypoglycemic Agents',
    items: [
      { name: 'VAISAPTIN M 50/500' },
      { name: 'D FLOZIN 10' },
      { name: 'SIMELLI D 100/10' },
      { name: 'SIMELLI D 100/10/500' },
      { name: 'GUAMET G1' },
      { name: 'GUAMET G2' },
      { name: 'GUAMET G3' },
      { name: 'GUAMET VG 2 FORTE' },
      { name: 'TUFORMIN G 4/500' },
      { name: 'PIOCEZ 15' },
    ]
  },
  {
    title: 'Nutritional Supplements',
    items: [
      { name: 'INCECAL 500' },
      { name: 'INCECAL 1000' },
      { name: 'CACOZ 500' },
      { name: 'NARVIT 1500' },
      { name: 'NERVEPT 1500' },
      { name: 'DIAPLUS DIABETES RICE' },
      { name: 'DIA SUGAR' },
      { name: 'KABIN B12' },
      { name: 'KABIN 100' },
      { name: 'ADIPOGO HP PROTEIN POWDER' },
      { name: 'VIVASUN 60 K' },
      { name: 'TRESSURE' },
      { name: 'VITPHEROL 600' },
      { name: 'MANGEVIT' },
    ]
  },
  {
    title: 'Antacids',
    items: [
      { name: 'RABICEPT 20' },
      { name: 'PRANA 40' },
      { name: 'SHAMPA D 40/10' },
      { name: 'SHAMPA DSR CAPSULES' },
    ]
  },
  {
    title: 'Gut Health',
    items: [
      { name: 'GI BIOTA' },
    ]
  },
  {
    title: 'Antihyperuricemic Medication',
    items: [
      { name: 'FEXAT 40' },
    ]
  },
  {
    title: 'Insulin Therapy Disposables',
    items: [
      { name: 'DIAPLUS SWABS' },
      { name: 'SITE ROTATION GUIDE' },
    ]
  },
  {
    title: 'Nephropathy',
    items: [
      { name: 'ACETAURI' },
    ]
  },
  {
    title: 'Antibiotics',
    items: [
      { name: 'MEEMOX 625' },
    ]
  },
  {
    title: 'Thyroid Care Products',
    items: [
      { name: 'THYROPLUS' },
      { name: 'SEPLUS 200' },
    ]
  },
];

function generateSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[\/]/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-+|\-+$/g, '');
}

function getAllMedicines(catalog) {
  const allMedicines = [];
  for (const category of catalog) {
    allMedicines.push(...category.items.map(item => ({
      name: item.name,
      slug: generateSlug(item.name)
    })));
  }
  return allMedicines;
}

const medicines = getAllMedicines(pharmacyCatalog);
const domain = 'https://www.drpraveenramachandra.com';
const today = new Date().toISOString().split('T')[0];

// Build sitemap XML
let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
sitemapXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

// Main pages
const mainPages = [
  '/',
  '/about',
  '/services',
  '/clinics',
  '/pharmacy',
  '/laboratory',
  '/queue',
  '/blog',
  '/contact',
];

mainPages.forEach(page => {
  sitemapXml += `  <url>\n`;
  sitemapXml += `    <loc>${domain}${page}</loc>\n`;
  sitemapXml += `    <lastmod>${today}</lastmod>\n`;
  sitemapXml += `    <changefreq>weekly</changefreq>\n`;
  sitemapXml += `    <priority>${page === '/' ? '1.0' : '0.8'}</priority>\n`;
  sitemapXml += `  </url>\n`;
});

// Medicine pages
medicines.forEach(medicine => {
  sitemapXml += `  <url>\n`;
  sitemapXml += `    <loc>${domain}/pharmacy/${medicine.slug}</loc>\n`;
  sitemapXml += `    <lastmod>${today}</lastmod>\n`;
  sitemapXml += `    <changefreq>monthly</changefreq>\n`;
  sitemapXml += `    <priority>0.7</priority>\n`;
  sitemapXml += `  </url>\n`;
});

sitemapXml += '</urlset>\n';

// Write sitemap.xml
const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');

console.log(`✓ Sitemap generated: ${sitemapPath}`);
console.log(`✓ Total URLs: ${mainPages.length + medicines.length}`);
console.log(`✓ Medicine URLs: ${medicines.length}`);
console.log(`✓ Sample URLs:`);
console.log(`  - ${domain}/pharmacy`);
medicines.slice(0, 3).forEach(m => {
  console.log(`  - ${domain}/pharmacy/${m.slug}`);
});
