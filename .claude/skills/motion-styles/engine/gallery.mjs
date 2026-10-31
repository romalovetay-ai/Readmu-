#!/usr/bin/env node
// gallery.mjs: one still per built style (at --t, default the demo's fan-out beat) tiled into a contact sheet.
//   node gallery.mjs [--t 6.5] [--out ~/Downloads/Motion Styles Gallery.jpg] [--only id1,id2]
// Uses one Chrome for every style (fast, low memory), so it is safe to run while nothing else renders.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => { if (v.startsWith('--')) a.push([v.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]); return a; }, []));
const T = Number(args.t || 6.5);
const index = JSON.parse(fs.readFileSync(path.join(here, '..', 'index.json'), 'utf8'));
const only = args.only ? new Set(String(args.only).split(',')) : null;
const ids = index.styles.map((s) => s.id).filter((id) => fs.existsSync(path.join(here, '..', 'styles', `${id}.js`)) && (!only || only.has(id)));
const out = path.resolve(String(args.out || path.join(process.env.HOME, 'Downloads', 'Motion Styles Gallery.jpg')));
const tmp = fs.mkdtempSync('/tmp/ms-gallery-');

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--allow-file-access-from-files'] });
const failed = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  for (const id of ids) {
    try {
      await page.goto(pathToFileURL(path.join(here, 'player.html')).href + `?style=${id}&w=1280&h=720&render=1`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction('window.READY || window.READY_ERROR', { timeout: 60000 });
      const err = await page.evaluate('window.READY_ERROR || null');
      if (err) throw new Error(err);
      const b64 = await page.evaluate((t) => { window.seek(t); return document.getElementById('c').toDataURL('image/jpeg', 0.85).split(',')[1]; }, T);
      fs.writeFileSync(path.join(tmp, `${String(ids.indexOf(id)).padStart(3, '0')}-${id}.jpg`), Buffer.from(b64, 'base64'));
      process.stdout.write(`\r${ids.indexOf(id) + 1}/${ids.length} ${id}            `);
    } catch (e) { failed.push(`${id}: ${String(e.message || e).slice(0, 120)}`); }
  }
} finally { await browser.close(); }

// tile with ffmpeg (8 across, labelled by filename order)
const cols = 8, n = fs.readdirSync(tmp).length, rows = Math.ceil(n / cols);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', path.join(tmp, '*.jpg'), '-vf', `scale=320:180,tile=${cols}x${rows}:padding=4:color=black`, '-frames:v', '1', '-update', '1', out]);
console.log(`\n${n} styles -> ${out}`);
if (failed.length) console.log('failed:\n  ' + failed.join('\n  '));
