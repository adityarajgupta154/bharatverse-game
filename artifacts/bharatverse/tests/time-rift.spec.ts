import { test, expect, type Page } from '@playwright/test';

/**
 * The Time Rift screen (route /oracle) — painted-scene redesign. The art
 * bakes the title/description/pill VISUALS into the painting, so these
 * tests assert the live layer on top: sr-only text for readers, the
 * transparent Wapas Naksha hit-area actually navigating, the animated
 * portal swirl layers, and the shared chrome being present.
 */
function collectRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(String(err)));
  return errors;
}

test.describe('Time Rift screen', () => {
  test('renders the painted scene with the animated portal, sidebar and chrome', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/oracle');

    // Painted scene + screen-reader copies of the baked text.
    await expect(page.getByTestId('rift-scene')).toBeVisible();
    await expect(page.getByRole('heading', { name: /the time rift/i })).toBeAttached();

    // Sidebar shows LIVE region state (fresh save: Sindhu Ghati selected).
    const panel = page.getByTestId('rift-info-panel');
    await expect(panel).toContainText(/mohenjo-daro/i); // uppercase is CSS-only
    await expect(panel).toContainText('3000 BCE');
    await expect(panel).toContainText('42%');
    await expect(panel).toContainText('18');
    await expect(panel).toContainText('/ 42');
    await expect(panel).toContainText('Indus Script Mysteries');

    // The portal layers are mounted and actually animating (keyframes
    // applied, not just declared): main swirl spins, the echo counter-
    // rotates with a screen blend, the glow breathes behind them.
    const swirl = page.getByTestId('rift-swirl');
    await expect(swirl).toBeVisible();
    expect(await swirl.evaluate(el => getComputedStyle(el).animationName)).toBe('rift-spin');

    const echo = page.getByTestId('rift-swirl-echo');
    await expect(echo).toBeVisible();
    expect(
      await echo.evaluate(el => {
        const s = getComputedStyle(el);
        return `${s.animationName} ${s.animationDirection} ${s.mixBlendMode}`;
      }),
    ).toBe('rift-spin reverse screen');

    expect(
      await page
        .getByTestId('rift-glow')
        .evaluate(el => getComputedStyle(el).animationName),
    ).toBe('rift-glow-pulse');

    // Shared chrome: top nav player identity + the "you are here" rift
    // marker. The filter and rift controls are deliberately INERT art on
    // this screen (no gates to filter; self-navigation would be a no-op),
    // so the real interactive versions must NOT be present.
    await expect(page.getByText('Level 8 Explorer')).toBeVisible();
    await expect(page.getByTestId('rift-current')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('link', { name: 'Time Rift' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Filter map gates' })).toHaveCount(0);

    expect(runtimeErrors).toEqual([]);
  });

  test('the painted Wapas Naksha pill navigates back to the memory map', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/oracle');

    const back = page.getByTestId('rift-back');
    await expect(back).toHaveAttribute('aria-label', 'Wapas Naksha');
    await back.click();

    // Hub is up: Smriti's HUD dialogue is a hub-only fixture.
    await expect(page.getByTestId('smriti-listen')).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test('the hub Time Rift button opens the rift screen', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/');

    await page.getByRole('link', { name: 'Time Rift' }).click();
    await expect(page.getByTestId('rift-scene')).toBeVisible();
    await expect(page.getByTestId('rift-back')).toBeVisible();

    expect(runtimeErrors).toEqual([]);
  });

  test('keyboard players can leave through the painted pill', async ({ page }) => {
    await page.goto('/oracle');
    await page.getByTestId('rift-back').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('smriti-listen')).toBeVisible();
  });

  test('the portal goes still for players who prefer reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/oracle');
    for (const id of ['rift-swirl', 'rift-swirl-echo', 'rift-glow']) {
      expect(
        await page.getByTestId(id).evaluate(el => getComputedStyle(el).animationName),
        `${id} should not animate under reduced motion`,
      ).toBe('none');
    }
  });

  test('the sidebar follows whichever region is selected on the map', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/');

    // Select a different region gate, then enter the rift: the live panel
    // must show THAT region, not a baked default.
    await page.getByRole('button', { name: /apni parampara/i }).click();
    await page.getByRole('link', { name: 'Time Rift' }).click();

    const panel = page.getByTestId('rift-info-panel');
    await expect(panel).toContainText(/utsav aangan/i);
    await expect(panel).toContainText('3 / 30');
    expect(runtimeErrors).toEqual([]);
  });

  /**
   * Pixel golden at exact stage scale (1024x592 viewport → scale 1). The
   * whole point of this screen is fidelity to the painted reference, and
   * the swirl/hit-area overlays are position-coupled to the crop — a
   * layout drift the DOM asserts can't see fails here. Playwright freezes
   * CSS animations for the shot, so the spinning swirl is deterministic.
   * Regenerate deliberately after visual changes:
   *   pnpm exec playwright test tests/time-rift.spec.ts --update-snapshots
   */
  test('the painted screen stays pixel-faithful to the reference', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 592 });
    await page.goto('/oracle');
    await expect(page.getByTestId('rift-scene')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('time-rift.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });
});
