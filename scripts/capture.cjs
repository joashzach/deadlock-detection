const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function capture() {
  const name = process.argv[2] || 'screenshot';
  const width = parseInt(process.argv[3] || '1440', 10);
  const height = parseInt(process.argv[4] || '900', 10);
  const url = process.argv[5] || 'http://localhost:5173/lab';
  const action = process.argv[6] || '';

  const outDir = 'C:\\Users\\joash\\.gemini\\antigravity-ide\\brain\\69ed7a5e-298e-4122-b896-80189acf25b8\\screenshots';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.join(outDir, `${name}.png`);

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--disable-gpu', '--no-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width, height },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  await page.goto(url, { waitUntil: 'networkidle' });

  if (action === 'click-matrices') {
    await page.getByRole('tab', { name: /Matrices/i }).click();
    await page.waitForTimeout(300);
  } else if (action === 'detect-deadlock') {
    await page.getByRole('button', { name: /Detect deadlock/i }).first().click();
    await page.waitForTimeout(500);
  } else if (action === 'learn-coffman') {
    await page.getByRole('tab', { name: /Four Coffman conditions/i }).click();
    await page.waitForTimeout(400);
  } else if (action === 'learn-rag') {
    await page.getByRole('tab', { name: /RAG vs WFG/i }).click();
    await page.waitForTimeout(400);
  } else {
    await page.waitForTimeout(400);
  }

  const overflow = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      hasHScroll: document.documentElement.scrollWidth > window.innerWidth,
    };
  });

  console.log(`Page layout metrics:`, JSON.stringify(overflow));
  console.log(`Console errors count: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: outFile });
  await browser.close();
  console.log(`Captured screenshot to ${outFile}`);
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
