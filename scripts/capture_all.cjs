const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const OUT_DIR = 'C:\\Users\\joash\\.gemini\\antigravity-ide\\brain\\a0136809-a855-49a8-9761-a7e595e66d44\\screenshots';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const SHOTS = [
  // 1280x665 (Primary Target)
  { name: 'landing_1280', url: 'http://localhost:5173/', width: 1280, height: 665 },
  { name: 'lab_graph_1280', url: 'http://localhost:5173/lab', width: 1280, height: 665 },
  {
    name: 'lab_graph_deadlock_1280',
    url: 'http://localhost:5173/lab',
    width: 1280,
    height: 665,
    action: async (page) => {
      await page.getByTestId('detect-button').click({ force: true });
      await page.waitForTimeout(600);
    },
  },
  {
    name: 'lab_simulator_1280',
    url: 'http://localhost:5173/lab',
    width: 1280,
    height: 665,
    action: async (page) => {
      await page.locator('#preset-select').selectOption('dining-philosophers');
      await page.waitForTimeout(400);
      await page.getByRole('tab', { name: 'Simulator' }).click();
      await page.waitForTimeout(600);
    },
  },
  { name: 'learn_1280', url: 'http://localhost:5173/learn', width: 1280, height: 665 },
  { name: 'quiz_1280', url: 'http://localhost:5173/quiz', width: 1280, height: 665 },
  { name: 'about_1280', url: 'http://localhost:5173/about', width: 1280, height: 665 },

  // 1440
  { name: 'landing_1440', url: 'http://localhost:5173/', width: 1440, height: 900 },
  { name: 'lab_graph_1440', url: 'http://localhost:5173/lab', width: 1440, height: 900 },
  {
    name: 'lab_graph_deadlock_1440',
    url: 'http://localhost:5173/lab',
    width: 1440,
    height: 900,
    action: async (page) => {
      await page.getByTestId('detect-button').click({ force: true });
      await page.waitForTimeout(600);
    },
  },
  {
    name: 'lab_simulator_1440',
    url: 'http://localhost:5173/lab',
    width: 1440,
    height: 900,
    action: async (page) => {
      // select dining philosophers to match reference
      await page.locator('#preset-select').selectOption('dining-philosophers');
      await page.waitForTimeout(400);
      await page.getByRole('tab', { name: 'Simulator' }).click();
      await page.waitForTimeout(600);
    },
  },
  { name: 'learn_1440', url: 'http://localhost:5173/learn', width: 1440, height: 900 },
  { name: 'quiz_1440', url: 'http://localhost:5173/quiz', width: 1440, height: 900 },
  { name: 'about_1440', url: 'http://localhost:5173/about', width: 1440, height: 900 },

  // 390
  { name: 'landing_390', url: 'http://localhost:5173/', width: 390, height: 844 },
  { name: 'lab_graph_390', url: 'http://localhost:5173/lab', width: 390, height: 844 },
  {
    name: 'lab_graph_deadlock_390',
    url: 'http://localhost:5173/lab',
    width: 390,
    height: 844,
    action: async (page) => {
      await page.getByTestId('detect-button').click({ force: true });
      await page.waitForTimeout(600);
    },
  },
  {
    name: 'lab_simulator_390',
    url: 'http://localhost:5173/lab',
    width: 390,
    height: 844,
    action: async (page) => {
      await page.getByRole('tab', { name: 'Simulator' }).click();
      await page.waitForTimeout(600);
    },
  },
  { name: 'learn_390', url: 'http://localhost:5173/learn', width: 390, height: 844 },
  { name: 'quiz_390', url: 'http://localhost:5173/quiz', width: 390, height: 844 },
  { name: 'about_390', url: 'http://localhost:5173/about', width: 390, height: 844 },
];

async function run() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--disable-gpu', '--no-sandbox'],
  });

  for (const shot of SHOTS) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
    });
    const page = await context.newPage();
    await page.goto(shot.url, { waitUntil: 'networkidle' });
    if (shot.action) {
      await shot.action(page);
    }
    await page.waitForTimeout(400);

    const outFile = path.join(OUT_DIR, `${shot.name}.png`);
    await page.screenshot({ path: outFile });
    console.log(`Saved screenshot: ${shot.name}.png`);
    await context.close();
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
