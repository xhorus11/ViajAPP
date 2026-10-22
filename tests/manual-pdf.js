const puppeteer = require('puppeteer-core');
const path = require('path');
const [URL, PDF, SHOTS] = process.argv.slice(2);
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('requestfailed', r => errs.push('falló: ' + r.url()));
  // Vista celular
  await page.setViewport({ width: 400, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { for (const img of document.images) { img.loading = 'eager'; if (!img.complete) await new Promise(r => { img.onload = img.onerror = r; }); } });
  await page.screenshot({ path: path.join(SHOTS, 'm-movil-1.png') });
  await page.evaluate(() => document.getElementById('super').scrollIntoView()); await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SHOTS, 'm-movil-2.png') });
  // Vista computador
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.evaluate(() => document.getElementById('dinero').scrollIntoView()); await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SHOTS, 'm-escritorio.png') });
  // PDF
  await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
  await page.emulateMediaType('print');
  await page.pdf({ path: PDF, format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } });
  console.log('Errores:', errs.length ? errs.join(' / ') : 'ninguno');
  await browser.close();
})();
