const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/lab');
  const tabs = await page.locator('[role="tablist"][aria-label="Analysis panels"] button').all();
  for (const t of tabs) {
    const box = await t.boundingBox();
    console.log(await t.innerText(), JSON.stringify(box), 'ends at x =', box.x + box.width);
  }
  const aside = await page.locator('aside[aria-label="Analysis panels"]').boundingBox();
  console.log('Right panel aside box:', JSON.stringify(aside), 'ends at x =', aside.x + aside.width);
  await browser.close();
})();
