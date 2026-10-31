#!/usr/bin/env node
// render.mjs: render a motion-style scene to MP4 (or stills) in headless Chrome, frame by frame.
//   node render.mjs --style whiteboard [--scene /abs/scene.js] [--size 1280x720|1080x1920] [--fps 30]
//                   [--out out.mp4] [--stills 1.0,4.5,9] [--no-audio] [--voiceover] [--from 0 --to 6]
// --crf N: x264 quality (17 default; 24 for small web previews).
// --voiceover: lighter SFX mix with beds/music dropped, for laying narration on top.
// Frames come from window.seek(t) (pure function of t), audio from SND.renderOffline (same score as the player).
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => { if (v.startsWith('--')) a.push([v.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]); return a; }, []));
const style = args.style || 'whiteboard';
const [W, H] = String(args.size || '1280x720').split('x').map(Number);
const fps = Number(args.fps || 30);
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const qs = new URLSearchParams({ style, w: W, h: H, render: '1' });
if (args.scene) qs.set('scene', pathToFileURL(path.resolve(args.scene)).href);
const url = pathToFileURL(path.join(here, 'player.html')).href + '?' + qs;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction('window.READY || window.READY_ERROR', { timeout: 120000 });
  const bad = await page.evaluate('window.READY_ERROR || null');
  if (bad) throw new Error(bad);
  const D = await page.evaluate('window.DURATION');
  const grab = async (t) => {
    const b64 = await page.evaluate((tt) => { window.seek(tt); return document.getElementById('c').toDataURL('image/jpeg', 0.93).split(',')[1]; }, t);
    return Buffer.from(b64, 'base64');
  };

  if (args.stills) {
    const ts = String(args.stills).split(',').map(Number);
    const dir = args.out ? path.resolve(args.out) : path.resolve(`stills-${style}`);
    fs.mkdirSync(dir, { recursive: true });
    for (const t of ts) fs.writeFileSync(path.join(dir, `${style}-${t.toFixed(2)}.jpg`), await grab(t));
    console.log(`stills -> ${dir} (${ts.length})`);
  } else {
    const out = path.resolve(args.out || `${style}-${W}x${H}.mp4`);
    const t0 = Number(args.from || 0), t1 = Math.min(D, Number(args.to || D));
    const n = Math.round((t1 - t0) * fps);
    let wav = null;
    if (!args['no-audio']) {
      const b64 = await page.evaluate(async (a, b, vo) => { const f = await SND.renderOffline(window.scoreSound, b, 48000, { voiceover: vo }); const start = Math.floor(a * 48000) * 2, end = Math.floor(b * 48000) * 2; const s = f.subarray(start, end); let bin = ''; const u8 = new Uint8Array(s.buffer, s.byteOffset, s.byteLength); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(bin); }, t0, t1, !!args.voiceover);
      wav = out.replace(/\.mp4$/, '.f32');
      fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
    }
    const ffArgs = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
    if (wav) ffArgs.push('-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', wav);
    ffArgs.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(args.crf || 17), '-preset', 'medium');
    if (wav) ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
    ffArgs.push('-movflags', '+faststart', out);
    const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
    const started = Date.now();
    for (let i = 0; i < n; i++) {
      const buf = await grab(t0 + i / fps);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 60 === 0) process.stdout.write(`\r${i}/${n} frames`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    if (wav) fs.unlinkSync(wav);
    console.log(`\r${n}/${n} frames -> ${out} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  }
  if (errors.length) console.log('page errors:\n  ' + errors.slice(0, 5).join('\n  '));
} finally {
  await browser.close();
}
