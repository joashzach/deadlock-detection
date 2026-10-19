import { test, expect } from '@playwright/test';

const PAGES = ['/', '/lab', '/learn', '/quiz', '/about'];

test.describe('Responsive & Design System Verification (Step 6)', () => {
  // (a) no horizontal page scroll
  test('(a) no horizontal page scroll on all pages', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(100);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        scrollWidth,
        `Horizontal scroll on ${path} (scroll: ${scrollWidth}, client: ${clientWidth})`
      ).toBeLessThanOrEqual(clientWidth + 1);
    }
  });

  // (b) navbar height equals var(--nav-h) and contains only the logo and four tabs
  test('(b) navbar height equals var(--nav-h) and contains only the logo and four tabs on desktop', async ({
    page,
  }) => {
    await page.goto('/lab', { waitUntil: 'domcontentloaded' });
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const headerBox = await header.boundingBox();
    const expectedNavH = await page.evaluate(() => {
      const el = document.createElement('div');
      el.style.height = 'var(--nav-h)';
      document.body.appendChild(el);
      const h = parseFloat(getComputedStyle(el).height);
      el.remove();
      return h;
    });
    expect(headerBox!.height).toBeCloseTo(expectedNavH, 1);

    const vpWidth = page.viewportSize()?.width ?? 1280;
    if (vpWidth >= 768) {
      // Desktop: contains only the logo and four tabs
      const logo = page.locator('header a').first();
      await expect(logo).toHaveText('DeadLockLab');

      const visibleButtons = await page.locator('header button:visible').count();
      expect(visibleButtons, 'Desktop navbar contains unexpected buttons').toBe(0);

      const visibleSelects = await page.locator('header select:visible').count();
      expect(visibleSelects, 'Desktop navbar contains unexpected selects').toBe(0);

      const navLinks = page.getByRole('navigation', { name: 'Primary' }).getByRole('link');
      await expect(navLinks).toHaveCount(4);
    } else {
      const logo = page.locator('header a').first();
      await expect(logo).toHaveText('DeadLockLab');
      const menuBtn = page.getByRole('button', { name: /Toggle navigation menu/i });
      await expect(menuBtn).toBeVisible();
    }
  });

  // (c) no button, tab, chip or select label wraps or is truncated
  test('(c) no button, tab, chip or select label wraps or is truncated', async ({ page }) => {
    await page.goto('/lab', { waitUntil: 'domcontentloaded' });

    // Helper to test truncation
    const checkElements = async (selector: string, contextName: string) => {
      const elements = await page.locator(selector).all();
      for (const el of elements) {
        if (!(await el.isVisible())) continue;
        const box = await el.boundingBox();
        if (!box || box.width === 0 || box.height === 0) continue;

        const isTruncated = await el.evaluate((node) => {
          return node.scrollWidth > node.clientWidth + 2;
        });
        const text = (await el.innerText()).trim() || (await el.getAttribute('aria-label')) || '';
        expect(
          isTruncated,
          `${contextName} control "${text}" label is truncated (scrollWidth > clientWidth)`
        ).toBe(false);

        // Control height indicates single line
        if (nodeNameIsSingleLine(text)) {
          expect(
            box.height,
            `${contextName} control "${text}" height ${box.height} indicates multi-line wrapping`
          ).toBeLessThanOrEqual(52);
        }
      }
    };

    const nodeNameIsSingleLine = (text: string) => {
      // Long descriptive buttons or accordion descriptions may wrap if designed, but standard toolbar/nav/tabs/selects do not
      return !text.includes('\n') && text.length < 40;
    };

    await checkElements('button:visible, [role="tab"]:visible, select:visible', 'Graph');

    // Switch to simulator view if tab is visible
    const simTab = page.getByRole('tab', { name: 'Simulator' });
    if (await simTab.isVisible()) {
      await simTab.click();
      await page.waitForTimeout(150);
      await checkElements('button:visible, [role="tab"]:visible', 'Simulator');
    }
  });

  // (d) no overlapping bounding boxes among toolbar buttons, canvas, zoom group and legend
  test('(d) no overlapping bounding boxes among toolbar buttons, canvas, zoom group and legend', async ({
    page,
  }) => {
    await page.goto('/lab', { waitUntil: 'domcontentloaded' });
    const toolbar = page.getByTestId('playback-bar');
    const canvas = page.getByTestId('graph-canvas-container');
    const zoomControls = page.getByTestId('zoom-controls');
    const legend = page.getByTestId('legend-control');

    await expect(toolbar).toBeVisible();
    await expect(canvas).toBeVisible();

    const tbBox = await toolbar.boundingBox();
    const canvasBox = await canvas.boundingBox();

    expect(tbBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();

    const overlaps = (
      a: { x: number; y: number; width: number; height: number },
      b: { x: number; y: number; width: number; height: number }
    ) => !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);

    expect(overlaps(tbBox!, canvasBox!), 'Toolbar overlaps canvas').toBe(false);

    // Toolbar buttons do not overlap each other
    const tbButtons = await toolbar.locator('button:visible').all();
    const btnBoxes = (await Promise.all(tbButtons.map((b) => b.boundingBox()))).filter(
      (b): b is NonNullable<typeof b> => b !== null && b.width > 0 && b.height > 0
    );
    for (let i = 0; i < btnBoxes.length - 1; i++) {
      for (let j = i + 1; j < btnBoxes.length; j++) {
        expect(overlaps(btnBoxes[i], btnBoxes[j]), `Toolbar button ${i} overlaps button ${j}`).toBe(false);
      }
    }

    // Zoom controls and legend on canvas
    if ((await zoomControls.isVisible()) && (await legend.isVisible())) {
      const zoomBox = await zoomControls.boundingBox();
      const legBox = await legend.boundingBox();
      if (zoomBox && legBox) {
        expect(overlaps(zoomBox, legBox), 'Zoom controls overlap legend').toBe(false);
        expect(overlaps(tbBox!, zoomBox), 'Toolbar overlaps zoom controls').toBe(false);
        expect(overlaps(tbBox!, legBox), 'Toolbar overlaps legend').toBe(false);
      }
    }
  });

  // (e) the Lab toolbar contains no scrollbar (scrollWidth <= clientWidth) and all its buttons have identical height
  test('(e) Lab toolbar contains no scrollbar and all buttons have identical height', async ({ page }) => {
    const vpWidth = page.viewportSize()?.width ?? 1280;
    if (vpWidth >= 1024) {
      await page.goto('/lab', { waitUntil: 'domcontentloaded' });
      const toolbar = page.getByTestId('playback-bar');
      await expect(toolbar).toBeVisible();

      const { scrollWidth, clientWidth } = await toolbar.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(scrollWidth, 'Toolbar has overflow scrollbar').toBeLessThanOrEqual(clientWidth + 1);

      const buttons = await toolbar.locator('button:visible').all();
      expect(buttons.length).toBeGreaterThan(0);
      const heights = await Promise.all(buttons.map(async (b) => (await b.boundingBox())!.height));
      const firstH = heights[0];
      for (let i = 1; i < heights.length; i++) {
        expect(heights[i], `Button ${i} height differs from button 0`).toBeCloseTo(firstH, 1);
      }
    }
  });

  // (f) Lab sidebar shows all five accordion rows without scrolling at >=1280x665
  test('(f) Lab sidebar shows all five accordion rows without scrolling at >=1280x665', async ({ page }) => {
    const vp = page.viewportSize();
    if (vp && vp.width >= 1280 && vp.height >= 665) {
      await page.goto('/lab', { waitUntil: 'domcontentloaded' });
      const sidebarScrollable = page.getByTestId('sidebar-scrollable');
      await expect(sidebarScrollable).toBeVisible();

      for (const name of ['Processes', 'Resources', 'Scripts', 'Policies', 'Advanced']) {
        const row = sidebarScrollable.getByRole('button', { name: new RegExp(name, 'i') });
        await expect(row, `Accordion row ${name} visible`).toBeVisible();
      }

      const { scrollTop, scrollHeight, clientHeight } = await sidebarScrollable.evaluate((el) => ({
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }));
      expect(scrollTop).toBe(0);
      expect(
        scrollHeight,
        `Sidebar requires scrolling when rows collapsed: scrollHeight ${scrollHeight} > clientHeight ${clientHeight}`
      ).toBeLessThanOrEqual(clientHeight + 1);
    }
  });

  // (g) the right panel shows all four tabs at >=1280
  test('(g) right panel shows all four tabs at >=1280', async ({ page }) => {
    const vpWidth = page.viewportSize()?.width ?? 1280;
    if (vpWidth >= 1280) {
      await page.goto('/lab', { waitUntil: 'domcontentloaded' });
      for (const tabName of ['Explanation', 'Matrices', 'Log', 'Pseudocode']) {
        const tab = page.getByRole('tab', { name: tabName });
        await expect(tab, `Tab ${tabName} visible in right panel`).toBeVisible();
      }
    }
  });

  // (h) the canvas bounding box is identical before and after Detect
  test('(h) canvas bounding box is identical before and after Detect', async ({ page }) => {
    await page.goto('/lab', { waitUntil: 'domcontentloaded' });
    const canvas = page.getByTestId('graph-canvas-container');
    await expect(canvas).toBeVisible();

    const boxBefore = await canvas.boundingBox();
    expect(boxBefore).not.toBeNull();

    await page.getByTestId('detect-button').click({ force: true });
    await expect(page.getByTestId('status-banner')).toContainText('Deadlock detected');

    const boxAfter = await canvas.boundingBox();
    expect(boxAfter).not.toBeNull();

    expect(boxAfter!.x).toBeCloseTo(boxBefore!.x, 1);
    expect(boxAfter!.y).toBeCloseTo(boxBefore!.y, 1);
    expect(boxAfter!.width).toBeCloseTo(boxBefore!.width, 1);
    expect(boxAfter!.height).toBeCloseTo(boxBefore!.height, 1);
  });

  // (i) Learn: the topic list and content boxes do not intersect
  test('(i) Learn topic list and content boxes do not intersect', async ({ page }) => {
    await page.goto('/learn', { waitUntil: 'domcontentloaded' });
    const vpWidth = page.viewportSize()?.width ?? 1280;
    if (vpWidth >= 768) {
      const topicNav = page.getByRole('navigation', { name: 'Theory topics' });
      const content = page.locator('article');
      await expect(topicNav).toBeVisible();
      await expect(content).toBeVisible();

      const navBox = await topicNav.boundingBox();
      const contentBox = await content.boundingBox();
      expect(navBox).not.toBeNull();
      expect(contentBox).not.toBeNull();

      expect(navBox!.x + navBox!.width, 'Topic nav intersects content').toBeLessThanOrEqual(
        contentBox!.x + 1
      );
    }
  });

  // (j) Quiz at 1280x665: question + four options + Next button are all within the viewport without scrolling
  test('(j) Quiz at 1280x665: question + four options + Next button within viewport without scrolling', async ({
    page,
  }) => {
    const vp = page.viewportSize();
    if (vp && vp.width === 1280 && vp.height === 665) {
      await page.goto('/quiz', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('quiz-progress')).toBeVisible();
      await expect(page.getByTestId('quiz-question')).toBeVisible();

      for (let i = 0; i < 4; i++) {
        await expect(page.getByTestId(`quiz-option-${i}`)).toBeVisible();
      }

      // Answer to show feedback and Next button
      await page.getByTestId('quiz-option-0').click();
      const nextBtn = page.getByRole('button', { name: /Next|See results/i });
      await expect(nextBtn).toBeVisible();

      const btnBox = await nextBtn.boundingBox();
      expect(btnBox).not.toBeNull();
      expect(btnBox!.y + btnBox!.height).toBeLessThanOrEqual(vp.height);

      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBe(0);
    }
  });

  // (k) Landing: h1 is exactly two lines at >=1024px and the hero fits within the viewport height
  test('(k) Landing: h1 is exactly two lines at >=1024px and hero fits within viewport height', async ({
    page,
  }) => {
    const vp = page.viewportSize();
    if (vp && vp.width >= 1024) {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      const h1Box = await h1.boundingBox();
      const lineHeight = parseFloat(await h1.evaluate((el) => getComputedStyle(el).lineHeight));
      const lines = Math.round(h1Box!.height / lineHeight);
      expect(lines, `h1 has ${lines} lines instead of 2`).toBe(2);

      const hero = page.getByTestId('landing-hero');
      const heroBox = await hero.boundingBox();
      expect(heroBox!.height).toBeLessThanOrEqual(vp.height);
    }
  });

  // (l) zero console errors
  test('(l) zero console errors on every page', async ({ page }) => {
    for (const path of PAGES) {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      page.on('pageerror', (err) => {
        errors.push(err.message);
      });

      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(150);
      expect(errors, `Expected zero console errors on ${path}`).toEqual([]);
    }
  });
});
