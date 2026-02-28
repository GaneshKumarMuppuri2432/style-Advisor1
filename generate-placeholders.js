/**
 * generate-placeholders.js
 * Generates styled SVG placeholder files (saved as .jpg names) for all outfit categories.
 * Run: node generate-placeholders.js
 * NOTE: Only creates files that don't already exist — safe to run with real images in place.
 */

const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, 'assets');

// ─── Exact folder + file structure matching the JSON configs ──────────────────
const STRUCTURE = {
    male: {
        college: { tops: 5, bottoms: 5, footwear: 5, accessories: 5 },
        gym: { tops: 5, bottoms: 5, footwear: 5, accessories: 5 },
        interview: { tops: 5, bottoms: 5, footwear: 5, accessories: 5 },
        party: { tops: 5, bottoms: 5, footwear: 5, accessories: 5 },
        traditional: { tops: 5, bottoms: 5, footwear: 5, accessories: 5 },
    },
    female: {
        college: { clothes: 5, footwear: 5, accessories: 5 },
        gym: { clothes: 5, footwear: 5, accessories: 5 },
        interview: { clothes: 5, footwear: 5, accessories: 5 },
        party: { clothes: 5, footwear: 5, accessories: 5 },
        traditional: { clothes: 5, footwear: 5, accessories: 5 },
    },
};

// ─── File name patterns (must match JSON entries exactly) ─────────────────────
const FILENAME_PATTERNS = {
    // male
    tops: (i) => `top${i}.jpg`,
    bottoms: (i) => `bottom${i}.jpg`,
    footwear: (i) => `shoe${i}.jpg`,
    accessories: (i) => `watch${i}.jpg`, // male accessories
    // female
    clothes: (i) => `dress${i}.jpg`,
    // female accessories & footwear reuse keys above, so we handle via gender below
};

// Female accessories use bag1.jpg instead of watch1.jpg
const FEMALE_FILENAME_PATTERNS = {
    clothes: (i) => `dress${i}.jpg`,
    footwear: (i) => `shoe${i}.jpg`,
    accessories: (i) => `bag${i}.jpg`,
};

// ─── Colours per category ─────────────────────────────────────────────────────
const COLOURS = {
    tops: ['#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#8b5cf6'],
    bottoms: ['#1d4ed8', '#1e40af', '#1e3a8a', '#2563eb', '#3b82f6'],
    footwear: ['#92400e', '#78350f', '#b45309', '#d97706', '#f59e0b'],
    accessories: ['#064e3b', '#059669', '#047857', '#10b981', '#34d399'],
    clothes: ['#be185d', '#9d174d', '#db2777', '#ec4899', '#f472b6'],
};

function makeSVG(label, color, idx) {
    const lighter = color + '99';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260">
  <defs>
    <linearGradient id="g${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${lighter};stop-opacity:0.6"/>
    </linearGradient>
  </defs>
  <rect width="200" height="260" rx="16" fill="#0a0a1a"/>
  <rect x="20" y="20" width="160" height="185" rx="12" fill="url(#g${idx})" opacity="0.85"/>
  <text x="100" y="228" font-family="Arial,sans-serif" font-size="12" font-weight="bold"
        fill="#e2e8f0" text-anchor="middle">${label}</text>
  <text x="100" y="248" font-family="Arial,sans-serif" font-size="9"
        fill="#94a3b8" text-anchor="middle">Style Advisor</text>
</svg>`;
}

let created = 0;
let skipped = 0;
let idx = 0;

for (const [gender, occasions] of Object.entries(STRUCTURE)) {
    const patterns = gender === 'female' ? FEMALE_FILENAME_PATTERNS : FILENAME_PATTERNS;

    for (const [occasion, categories] of Object.entries(occasions)) {
        for (const [category, count] of Object.entries(categories)) {
            const dirPath = path.join(ASSETS, gender, occasion, category);
            fs.mkdirSync(dirPath, { recursive: true });

            const colorList = COLOURS[category] || COLOURS.tops;
            const nameFn = patterns[category] || ((i) => `${category}${i}.jpg`);

            for (let i = 1; i <= count; i++) {
                const filename = nameFn(i);
                const filePath = path.join(dirPath, filename);

                if (!fs.existsSync(filePath)) {
                    const label = filename.replace('.jpg', '');
                    fs.writeFileSync(filePath, makeSVG(label, colorList[(i - 1) % colorList.length], idx++), 'utf8');
                    created++;
                } else {
                    skipped++;
                }
            }
        }
    }
}

console.log(`\n✅ Placeholder generation complete!`);
console.log(`   Created : ${created} new files`);
console.log(`   Skipped : ${skipped} (already exist — real images preserved)\n`);
console.log('Category mapping:');
console.log('  male   → tops/      → top1.jpg … top5.jpg');
console.log('  male   → bottoms/   → bottom1.jpg … bottom5.jpg');
console.log('  male   → footwear/  → shoe1.jpg … shoe5.jpg');
console.log('  male   → accessories/ → watch1.jpg … watch5.jpg');
console.log('  female → clothes/   → dress1.jpg … dress5.jpg');
console.log('  female → footwear/  → shoe1.jpg … shoe5.jpg');
console.log('  female → accessories/ → bag1.jpg … bag5.jpg\n');
