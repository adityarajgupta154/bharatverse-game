import { expect, test, type Page } from '@playwright/test';

function collectRuntimeErrors(page: Page) {
  const errors: Error[] = [];
  page.on('pageerror', error => errors.push(error));
  return errors;
}

test.describe('Legend chips and FILTER popover', () => {
  test('hub legend chips are real toggles that dim matching gates', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/');

    const lockedChip = page.getByRole('button', { name: /^Locked — map par/ });
    const lockedGate = page.getByRole('button', { name: /Magadha Kaal — .*\(locked\)/ });
    await expect(lockedChip).toHaveAttribute('aria-pressed', 'true');
    await expect(lockedGate).toBeEnabled();

    await lockedChip.click();
    await expect(lockedChip).toHaveAttribute('aria-pressed', 'false');
    await expect(lockedGate).toBeDisabled();

    await lockedChip.click();
    await expect(lockedChip).toHaveAttribute('aria-pressed', 'true');
    await expect(lockedGate).toBeEnabled();
    expect(runtimeErrors).toEqual([]);
  });

  test('chip state survives a reload', async ({ page }) => {
    await page.goto('/');
    const chip = page.getByRole('button', { name: /^Locked — map par/ });
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'false');

    await page.reload();
    await expect(page.getByRole('button', { name: /^Locked — map par/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('FILTER popover lists all four categories and shares state with the chips', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Filter map gates' }).click();

    for (const label of ['Explored', 'In Progress', 'Locked', 'Story Mission']) {
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
    }

    await page.getByRole('button', { name: 'Story Mission', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Story Mission — map par/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('legend chips dim matching buildings in the village', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/world/sindhu-ghati');

    const storyBuilding = page.getByRole('button', { name: /Naali Paheli — Drain Puzzle/ });
    await expect(storyBuilding).toBeEnabled();

    await page.getByRole('button', { name: /^Story Mission — map par/ }).click();
    await expect(storyBuilding).toBeDisabled();
    await expect(storyBuilding).toHaveAccessibleName(/filter se chhupa/);

    await page.getByRole('button', { name: /^Explored — map par/ }).click();
    await expect(page.getByRole('button', { name: /Sheher ka Dwaar — City Entry/ })).toBeDisabled();
    expect(runtimeErrors).toEqual([]);
  });
});
