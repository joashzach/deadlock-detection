import { test, expect } from '@playwright/test';

test.describe('DeadlockLab E2E Suite', () => {
  test('nav tabs route correctly and the active underline follows', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible();

    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;

    if (isMobile) {
      const routes = [
        { name: 'Lab', url: /\/lab/ },
        { name: 'Learn', url: /\/learn/ },
        { name: 'Quiz', url: /\/quiz/ },
        { name: 'About', url: /\/about/ },
      ];
      for (const r of routes) {
        const menuBtn = page.getByRole('button', { name: /Toggle navigation menu/i });
        await menuBtn.click();
        const mobileNav = page.getByRole('navigation', { name: 'Mobile Primary' });
        await mobileNav.getByRole('link', { name: r.name }).click();
        await expect(page).toHaveURL(r.url);
      }
    } else {
      const nav = page.getByRole('navigation', { name: 'Primary' });

      // 1. Navigate to Lab
      await nav.getByRole('link', { name: 'Lab' }).click();
      await expect(page).toHaveURL(/\/lab/);
      const labLink = nav.getByRole('link', { name: 'Lab' });
      await expect(labLink).toHaveClass(/border-navy/);
      await expect(labLink).toHaveAttribute('aria-current', 'page');

      // 2. Navigate to Learn
      await nav.getByRole('link', { name: 'Learn' }).click();
      await expect(page).toHaveURL(/\/learn/);
      const learnLink = nav.getByRole('link', { name: 'Learn' });
      await expect(learnLink).toHaveClass(/border-navy/);
      await expect(learnLink).toHaveAttribute('aria-current', 'page');

      // 3. Navigate to Quiz
      await nav.getByRole('link', { name: 'Quiz' }).click();
      await expect(page).toHaveURL(/\/quiz/);
      const quizLink = nav.getByRole('link', { name: 'Quiz' });
      await expect(quizLink).toHaveClass(/border-navy/);
      await expect(quizLink).toHaveAttribute('aria-current', 'page');

      // 4. Navigate to About
      await nav.getByRole('link', { name: 'About' }).click();
      await expect(page).toHaveURL(/\/about/);
      const aboutLink = nav.getByRole('link', { name: 'About' });
      await expect(aboutLink).toHaveClass(/border-navy/);
      await expect(aboutLink).toHaveAttribute('aria-current', 'page');
    }
  });

  test('Lab has no layout shift on Detect', async ({ page }) => {
    await page.goto('/lab', { waitUntil: 'domcontentloaded' });

    const canvas = page.getByTestId('graph-canvas-container');
    await expect(canvas).toBeVisible();

    // Measure bounding box before detect
    const boxBefore = await canvas.boundingBox();
    expect(boxBefore).not.toBeNull();

    // Trigger detection
    await page.getByTestId('detect-button').click({ force: true });

    // Wait for deadlock detected status banner to show
    await expect(page.getByTestId('status-banner')).toContainText('Deadlock detected');

    // Measure bounding box after detect
    const boxAfter = await canvas.boundingBox();
    expect(boxAfter).not.toBeNull();

    // Canvas must not move or shift dimensions at all
    expect(boxAfter!.x).toBeCloseTo(boxBefore!.x, 1);
    expect(boxAfter!.y).toBeCloseTo(boxBefore!.y, 1);
    expect(boxAfter!.width).toBeCloseTo(boxBefore!.width, 1);
    expect(boxAfter!.height).toBeCloseTo(boxBefore!.height, 1);
  });

  test('the Matrices tab shows P1→R1 = 1 and P2→R2 = 1 for the classic deadlock', async ({ page }) => {
    await page.goto('/lab', { waitUntil: 'domcontentloaded' });
    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
    if (isMobile) {
      const analysisBtn = page.getByRole('button', { name: /Analysis/i });
      if (await analysisBtn.isVisible()) {
        await analysisBtn.click();
      }
    }
    await page.getByRole('tab', { name: /Matrices/i }).click();

    const p1r1 = page.getByLabel('Allocation P1 R1');
    await expect(p1r1).toBeVisible();
    await expect(p1r1).toHaveValue('1');

    const p2r2 = page.getByLabel('Allocation P2 R2');
    await expect(p2r2).toBeVisible();
    await expect(p2r2).toHaveValue('1');

    const p1r2 = page.getByLabel('Allocation P1 R2');
    await expect(p1r2).toHaveValue('0');

    const p2r1 = page.getByLabel('Allocation P2 R1');
    await expect(p2r1).toHaveValue('0');
  });

  test('the Quiz flow works end to end', async ({ page }) => {
    await page.goto('/quiz', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('quiz-progress')).toContainText('Question 1 of');

    // Answer questions iteratively
    for (let i = 0; i < 8; i++) {
      // Pick first option
      await page.getByTestId('quiz-option-0').click();
      await expect(page.getByTestId('quiz-feedback')).toBeVisible();

      // Click Next
      await page.getByRole('button', { name: /Next|See results/i }).click();
    }

    // End screen with score and Retry button
    await expect(page.getByTestId('quiz-score')).toContainText('You scored');
    const retryBtn = page.getByRole('button', { name: 'Retry' });
    await expect(retryBtn).toBeVisible();

    // Retry resets quiz
    await retryBtn.click();
    await expect(page.getByTestId('quiz-progress')).toContainText('Question 1 of');
  });

  test('zero console errors on every page', async ({ page }) => {
    const pages = ['/', '/lab', '/learn', '/quiz', '/about'];

    for (const path of pages) {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          // Ignore harmless font/network noise if any
          errors.push(msg.text());
        }
      });
      page.on('pageerror', (err) => {
        errors.push(err.message);
      });

      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
      expect(errors, `Expected zero console errors on ${path}`).toEqual([]);
    }
  });
});
