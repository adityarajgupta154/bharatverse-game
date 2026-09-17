import { expect, test, type Page } from '@playwright/test';

function collectRuntimeErrors(page: Page) {
  const errors: Error[] = [];
  page.on('pageerror', error => errors.push(error));
  return errors;
}

/** ?debug mirrors Aru's live world position to window.__bhvWalk in BOTH renderers. */
async function aruWorldY(page: Page): Promise<number> {
  const y = await page.evaluate(
    () => (window as unknown as { __bhvWalk?: { y: number } }).__bhvWalk?.y
  );
  expect(typeof y).toBe('number');
  return y as number;
}

// Movement Bridge Task 10: the canvas VillageScene is the registry default and
// the legacy DOM walk renderer stays intact behind ?walk=dom. These specs guard
// BOTH sides of the flag so the fallback can't silently rot while it exists.
test.describe('walk renderer flag (Task 10)', () => {
  test('canvas is the default renderer for the Sindhu village', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    await page.goto('/world/sindhu-ghati?spawn=352,700');

    await expect(page.getByTestId('village-canvas')).toBeVisible();
    await expect(page.getByTestId('aru-walk')).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test('?walk=dom fallback still walks, prompts, and opens/closes cards', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    // Same street tile the canvas-mode smoke test uses, in the legacy renderer.
    await page.goto('/world/sindhu-ghati?walk=dom&debug&spawn=352,700');

    await expect(page.getByTestId('aru-walk')).toBeVisible();
    await expect(page.getByTestId('village-canvas')).toHaveCount(0);

    // Proximity prompt → E opens the SAME card flow as the canvas renderer.
    const prompt = page.getByTestId('walk-prompt');
    await expect(prompt).toBeVisible();
    await expect(prompt).toContainText('Vishaal Snanagar');
    await page.keyboard.press('e');
    await expect(page.getByRole('dialog', { name: 'Vishaal Snanagar' })).toBeVisible();

    await page.getByRole('button', { name: 'Band karo' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Controls return after the card closes: Aru's WORLD y advances on
    // ArrowDown (column x=352 is walkable well past y=850, so no wall clamp).
    const y0 = await aruWorldY(page);
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowDown');
    const y1 = await aruWorldY(page);
    expect(y1).toBeGreaterThan(y0 + 30);

    expect(runtimeErrors).toEqual([]);
  });
});
