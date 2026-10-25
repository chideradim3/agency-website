// Usage: node screenshot.mjs <url> [label] [--mobile]
// Saves a full-page screenshot to "temporary screenshots/screenshot-N[-label].png".
import puppeteer from 'puppeteer';
import { mkdirSync, readdirSync } from 'node:fs';

const args = process.argv.slice(2);
const mobile = args.includes('--mobile');
const [url = 'http://localhost:3000', label] = args.filter(a => a !== '--mobile');

const dir = 'temporary screenshots';
mkdirSync(dir, { recursive: true });
const n = readdirSync(dir)
  .map(f => +(f.match(/^screenshot-(\d+)/)?.[1] ?? 0))
  .reduce((a, b) => Math.max(a, b), 0) + 1;
const out = `${dir}/screenshot-${n}${label ? `-${label}` : ''}.png`;

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport(mobile
  ? { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
  : { width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0' });
// Reveal-on-scroll content: scroll through the page so everything is visible.
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 250) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 150)); }
  window.scrollTo({ top: 0, behavior: 'instant' });
});
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
