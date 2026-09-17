import { expect, test, type Page } from '@playwright/test';

/**
 * Loads all four new region worlds with an unlocked save and captures a
 * ?debug screenshot of each (hotspot outlines over the painting) into
 * test-results/world-shots/. Doubles as a load regression for every world.
 */
const UNLOCKED_SAVE = {
  v: 3,
  nodes: [
    { id: 'sindhu-ghati', status: 'explored', restorationPercent: 100, memoriesFound: 6 },
    { id: 'apni-parampara', status: 'explored', restorationPercent: 100, memoriesFound: 5 },
  ],
};

function seedUnlockedSave(page: Page) {
  return page.addInitScript(save => {
    window.localStorage.setItem('bharatverse-state', JSON.stringify(save));
  }, UNLOCKED_SAVE);
}

for (const world of [
  {
    nodeId: 'magadha-kaal',
    at: 140,
    welcome: 'Gyan ki dharti Nalanda me swagat hai, Aru.',
    buildings: [/Dharmaganja Pustakalaya — The Great Library/, /Pothi Khoj — The Manuscript Hunt/],
  },
  {
    nodeId: 'kala-bhoomi',
    at: 130,
    welcome: 'Rang aur shilp ki bhoomi me swagat hai.',
    buildings: [/Bunkar Mandap — The Weaver's Pavilion/, /Rangoli Rang — Colors of the Courtyard/],
  },
  {
    nodeId: 'apni-parampara',
    at: 48,
    welcome: 'Utsav ka aangan tumhara hi intezaar kar raha tha!',
    buildings: [/Utsav Ghanti — The Festival Bell/, /Diye Jalao — Light the Lamps/],
  },
  {
    nodeId: 'khel-maidan',
    at: 200,
    welcome: 'Maidan pukaar raha hai — daud lagane ko taiyaar?',
    buildings: [/Kushti Akhada — The Wrestling Pit/, /Kho-Kho Daud — The Pole Run/],
  },
]) {
  test(`world ${world.nodeId} renders its painting, hotspots and welcome line`, async ({ page }) => {
    await seedUnlockedSave(page);

    await page.goto(`/world/${world.nodeId}?debug&at=${world.at}`);

    await expect(page.getByLabel('Village — scroll ya drag karke ghoomo')).toBeVisible();
    await expect(page.getByText(world.welcome)).toBeVisible();
    for (const name of world.buildings) {
      await expect(page.getByRole('button', { name })).toBeVisible();
    }
    await page.waitForTimeout(600); // welcome toast settles, art decodes
    // /tmp so the shots survive later `playwright test` runs (test-results is wiped per run)
    await page.screenshot({ path: `/tmp/world-shots/${world.nodeId}.png` });
  });
}
