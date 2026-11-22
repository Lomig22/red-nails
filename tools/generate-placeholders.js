#!/usr/bin/env node
/* ==========================================================================
   Générateur de visuels de remplacement (SVG)
   --------------------------------------------------------------------------
   Lit les couleurs de config.js et crée, pour chacune, 5 visuels SVG dans
   /images/[id-couleur]/ : 1-set, 2-main, 3-finition, 4-tailles, 5-kit.

   Usage :  node tools/generate-placeholders.js
   (à relancer si tu ajoutes une couleur dans config.js)
   Les couleurs qui ont leurs propres photos (images: [...] dans config.js)
   sont ignorées, et les fichiers autres que .svg ne sont jamais touchés.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8'), ctx);
const CFG = ctx.window.RN_CONFIG;
const SIZES = CFG.PRODUCT.sizes;      // 15
const PER_SIZE = CFG.PRODUCT.perSize; // 2

/* ---------- Couleurs ---------- */
const rgb = (h) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').slice(i, i + 2), 16));
const hex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
const light = (c, t) => mix(c, '#ffffff', t);
const dark = (c, t) => mix(c, '#000000', t);

/* ---------- Ongle amande (repère local 100 × 160, pointe en haut) ---------- */
const NAIL = 'M50 2 C74 14 92 48 92 88 L92 136 C92 150 74 158 50 158 C26 158 8 150 8 136 L8 88 C8 48 26 14 50 2Z';
const FRENCH_TIP = 'M8 82 C8 46 26 14 50 2 C74 14 92 46 92 82 C80 62 64 54 50 54 C36 54 20 62 8 82Z';

function defs(c) {
  const base = c.hex;
  const isDark = rgb(base).reduce((s, v) => s + v, 0) < 120;
  const edge = isDark ? light(base, 0.12) : dark(base, 0.28);
  return `<defs>
  <linearGradient id="nb" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${edge}"/>
    <stop offset=".3" stop-color="${light(base, isDark ? 0.16 : 0.12)}"/>
    <stop offset=".62" stop-color="${base}"/>
    <stop offset="1" stop-color="${dark(base, isDark ? 0 : 0.34)}"/>
  </linearGradient>
  <linearGradient id="nv" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
    <stop offset=".45" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".16"/>
  </linearGradient>
  <linearGradient id="hl" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".95"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="tip" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F4F0EE"/>
    <stop offset=".5" stop-color="${c.tip || '#ffffff'}"/>
    <stop offset="1" stop-color="#EDE6E3"/>
  </linearGradient>
  <linearGradient id="skin" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#D9A383"/>
    <stop offset=".45" stop-color="#F0C8AE"/>
    <stop offset="1" stop-color="#D49C7C"/>
  </linearGradient>
  <radialGradient id="bg" cx=".5" cy=".38" r=".8">
    <stop offset="0" stop-color="#FFFFFF"/>
    <stop offset="1" stop-color="${mix(light(base, 0.86), '#FCE9EC', 0.6)}"/>
  </radialGradient>
  <filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#3A0A14" flood-opacity=".22"/>
  </filter>
</defs>`;
}

function nail(c, x, y, s = 1, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-50 -80)" filter="url(#sh)">
  <path d="${NAIL}" fill="url(#nb)"/>
  ${c.tip ? `<path d="${FRENCH_TIP}" fill="url(#tip)"/>` : ''}
  <path d="${NAIL}" fill="url(#nv)"/>
  <path d="M27 40 C20 62 18 96 20 132 C23 137 28 137 30 132 C28 98 30 66 37 34 C34 30 30 32 27 40Z" fill="url(#hl)" opacity=".7"/>
  <ellipse cx="66" cy="46" rx="5" ry="11" transform="rotate(22 66 46)" fill="#fff" opacity=".6"/>
  <path d="${NAIL}" fill="none" stroke="${dark(c.hex, 0.45)}" stroke-opacity="${c.tip ? 0.6 : 0.3}" stroke-width="${c.tip ? 1.8 : 1.2}"/>
</g>`;
}

const FONT = `font-family="'Arial Black','Helvetica Neue',Arial,sans-serif"`;
const svg = (c, body, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${label}">
${defs(c)}
<rect width="800" height="800" fill="url(#bg)"/>
${body}
</svg>
`;
const caption = (txt, y = 742) => `<text x="400" y="${y}" text-anchor="middle" ${FONT} font-size="28" fill="#1A1416" letter-spacing="1">${txt}</text>`;

/* ---------- Vue 1 : set de 30 ongles ---------- */
function viewSet(c) {
  let body = `<rect x="40" y="96" width="720" height="580" rx="36" fill="#fff" filter="url(#sh)"/>`;
  const step = 680 / SIZES;
  const rowGap = 520 / PER_SIZE;
  for (let r = 0; r < PER_SIZE; r++) {
    const y = 96 + rowGap * (r + 0.5) + 10;
    for (let i = 0; i < SIZES; i++) body += nail(c, 60 + step * (i + 0.5), y, (step * 0.86) / 84 * (1 - i * 0.022));
  }
  return svg(c, body + caption(`30 ONGLES · ${c.name.toUpperCase()}`), `Set de 30 faux ongles ${c.name}`);
}

/* ---------- Vue 2 : ongles sur la main ---------- */
function viewHand(c) {
  const finger = (cx, top, w, rot) => `<g transform="rotate(${rot} ${cx} 640)">
  <rect x="${cx - w / 2}" y="${top}" width="${w}" height="${700 - top}" rx="${w / 2}" fill="url(#skin)"/>
  ${nail(c, cx, top + w * 0.2, (w * 0.8) / 84)}
</g>`;
  const body = `
  <g transform="rotate(-52 300 670)">
    <rect x="248" y="430" width="104" height="300" rx="52" fill="url(#skin)"/>
    ${nail(c, 300, 452, (104 * 0.8) / 84)}
  </g>
  <path d="M240 520 Q240 470 300 470 L600 470 Q668 470 668 540 L668 820 L250 820 Z" fill="url(#skin)"/>
  ${finger(300, 210, 94, -8)}
  ${finger(408, 160, 100, -2)}
  ${finger(512, 196, 94, 4)}
  ${finger(606, 290, 80, 11)}`;
  return svg(c, body, `Faux ongles ${c.name} posés sur une main`);
}

/* ---------- Vue 3 : gros plan finition ---------- */
function viewFinish(c) {
  const sparkle = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -20 L5 -5 L20 0 L5 5 L0 20 L-5 5 L-20 0 L-5 -5Z" fill="#fff" opacity=".9"/>`;
  const body = `
  <circle cx="400" cy="380" r="270" fill="${light(c.hex, 0.8)}" opacity=".55"/>
  ${nail(c, 400, 375, 3.4, -14)}
  ${sparkle(250, 190, 1.6)}${sparkle(560, 560, 1.1)}${sparkle(590, 230, 0.8)}
  ${caption('FINITION GEL LAQUÉE')}`;
  return svg(c, body, `Gros plan finition laquée ${c.name}`);
}

/* ---------- Vue 4 : les 10 tailles ---------- */
function viewSizes(c) {
  let body = `<text x="400" y="120" text-anchor="middle" ${FONT} font-size="34" fill="#1A1416">${SIZES} TAILLES</text>
  <text x="400" y="162" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#5E4B50">${PER_SIZE} ongles de chaque</text>`;
  const perRow = Math.ceil(SIZES / 2);
  for (let i = 0; i < SIZES; i++) {
    const row = i < perRow ? 0 : 1;
    const col = row ? i - perRow : i;
    const count = row ? SIZES - perRow : perRow;
    const x = 400 + (col - (count - 1) / 2) * 88;
    const y = row ? 520 : 290;
    body += nail(c, x, y, 0.62 - i * 0.017);
    body += `<circle cx="${x}" cy="${y + 92}" r="19" fill="#fff" stroke="#E8CDD2" stroke-width="2"/>
    <text x="${x}" y="${y + 100}" text-anchor="middle" ${FONT} font-size="18" fill="#1A1416">${i + 1}</text>`;
  }
  return svg(c, body + caption('DU PLUS GRAND AU PLUS PETIT', 742), `Les ${SIZES} tailles de faux ongles ${c.name}`);
}

/* ---------- Vue 5 : kit complet ---------- */
function pastilles() {
  let out = '';
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) out += `<rect x="${462 + k * 29}" y="${608 + r * 24}" width="22" height="18" rx="7" fill="#F3ECEA" stroke="#DCCFCB"/>`;
  return out;
}
function viewKit(c) {
  let tray = '';
  for (let i = 0; i < SIZES; i++) tray += nail(c, 198 + i * 29, 390, 0.32 - i * 0.006);
  const body = `
  <rect x="110" y="140" width="580" height="420" rx="34" fill="#0E0B0C" filter="url(#sh)"/>
  <text x="400" y="222" text-anchor="middle" ${FONT} font-size="44" fill="#fff" letter-spacing="3">RED <tspan fill="${c.hex === '#121012' ? '#C8102E' : light(c.hex, 0.05)}">NAILS</tspan></text>
  <rect x="160" y="262" width="480" height="250" rx="22" fill="#FFF5F6"/>
  ${tray}
  <text x="400" y="488" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#5E4B50">${c.name} · 30 ongles</text>
  <g transform="rotate(-8 250 640)"><rect x="140" y="620" width="230" height="30" rx="15" fill="#FF3D9A"/></g>
  <g transform="rotate(5 540 640)"><rect x="450" y="598" width="190" height="84" rx="10" fill="#fff" stroke="#E8CDD2" stroke-width="2"/>${pastilles()}</g>
  ${caption('LE KIT COMPLET', 742)}`;
  return svg(c, body, `Kit complet RED NAILS ${c.name}`);
}

/* ---------- Écriture ---------- */
const VIEWS = { '1-set': viewSet, '2-main': viewHand, '3-finition': viewFinish, '4-tailles': viewSizes, '5-kit': viewKit };
let count = 0;
CFG.COLORS.filter((c) => !(Array.isArray(c.images) && c.images.length)).forEach((c) => {
  const dir = path.join(ROOT, 'images', c.id);
  fs.mkdirSync(dir, { recursive: true });
  Object.entries(VIEWS).forEach(([file, fn]) => {
    fs.writeFileSync(path.join(dir, `${file}.svg`), fn(c));
    count++;
  });
});

/* Favicon */
fs.writeFileSync(
  path.join(ROOT, 'images', 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 160"><path d="${NAIL}" fill="#C8102E"/><path d="M27 40 C20 62 18 96 20 132 C23 137 28 137 30 132 C28 98 30 66 37 34 C34 30 30 32 27 40Z" fill="#fff" opacity=".6"/></svg>\n`
);
console.log(`✓ ${count} visuels générés dans /images`);
