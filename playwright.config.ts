import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'msedge',
    headless: true,
    launchOptions: {
      args: ['--disable-gpu', '--no-sandbox'],
    },
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },
  projects: [
    {
      name: '1280x665',
      use: {
        viewport: { width: 1280, height: 665 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: '1366x768',
      use: {
        viewport: { width: 1366, height: 768 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: '1440x900',
      use: {
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: '1920x1080',
      use: {
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: '1280x665-1.5x',
      use: {
        viewport: { width: 1280, height: 665 },
        deviceScaleFactor: 1.5,
      },
    },
    {
      name: '768x1024',
      use: {
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: '390x844',
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});

