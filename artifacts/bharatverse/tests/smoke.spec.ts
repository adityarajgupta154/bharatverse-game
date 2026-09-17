import { expect, test, type Page } from '@playwright/test';

function collectRuntimeErrors(page: Page) {
  const errors: Error[] = [];
  page.on('pageerror', error => errors.push(error));
  return errors;
}

test.describe('BharatVerse screen smoke checks', () => {
  test('loads the hub and navigates through the Sindhu gate', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Mohenjo-Daro' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Sindhu Ghati — Gateway to the Civilization/ }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Chapter' })).toBeVisible();

    await page
      .getByRole('button', { name: /Sindhu Ghati — Gateway to the Civilization/ })
      .click();

    await expect(page).toHaveURL(/\/world\/sindhu-ghati$/);
    await expect(
      page.getByLabel('Village — Aru ke saath ghoomo (WASD ya arrows)'),
    ).toBeVisible();
    await expect(page.getByTestId('aru-walk')).toBeVisible();
    await expect(page.getByText('Duniya ke pehle planned sheher me swagat hai.')).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test('an explore building opens its fact card and Yaad Lautao restores the memory', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    // Walk mode: ?spawn places Aru on the drain street — the camera follows
    // her, so the mid-city hotspots are on screen and clicking still works.
    await page.goto('/world/sindhu-ghati?spawn=512,640');

    await expect(
      page.getByLabel('Village — Aru ke saath ghoomo (WASD ya arrows)'),
    ).toBeVisible();

    const hotspot = page.getByRole('button', {
      name: /Dhaki Naaliyon ki Gali — Street of Covered Drains/,
    });
    await expect(hotspot).toBeVisible();
    await hotspot.click();

    // Activation card: real invitation + launch button (no "Jald aa raha hai").
    const card = page.getByRole('dialog', { name: 'Dhaki Naaliyon ki Gali' });
    await expect(card).toBeVisible();
    await expect(card.getByText('Gali ke neeche kya chhupa hai?')).toBeVisible();
    await expect(card.getByText('Jald aa raha hai')).toHaveCount(0);
    await card.getByRole('button', { name: 'Khoj Shuru Karo' }).click();

    // Fact card: written sections, the fun-fact box, and the restore action.
    await expect(page.getByText('Safai ki Yaad')).toBeVisible();
    await expect(page.getByText('Har ghar se juda')).toBeVisible();
    await expect(page.getByText('Kya Jaante Ho?')).toBeVisible();
    await page.getByRole('button', { name: 'Yaad Lautao' }).click();

    // Restoring closes the card; Smriti confirms the returned memory.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Naaliyon ki yaad laut aayi')).toBeVisible();

    // Re-opening shows the explored state with a replay action.
    await hotspot.click();
    await expect(card.getByText('Yaad laut chuki hai')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Phir Se Dekho' })).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test('the city gate replays the intro story recap', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    // Default entry starts at the gate — its hotspot is on screen.
    await page.goto('/world/sindhu-ghati');

    await page.getByRole('button', { name: /Sheher ka Dwaar — City Entry/ }).click();

    const card = page.getByRole('dialog', { name: 'Sheher ka Dwaar' });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Kahani Phir Se Suno' }).click();

    // Recap card: story beats + the "Raaz ki Baat" box; CTA closes it.
    await expect(page.getByText('Smriti ki Pukaar')).toBeVisible();
    await expect(page.getByText('Raaz ki Baat')).toBeVisible();
    await page.getByRole('button', { name: 'Chalo, Yaadein Lautayein!' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(runtimeErrors).toEqual([]);
  });

  test('village walking: E-prompt near a building opens its card, controls return after closing', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    // Spawn on the street tile beside the Great Bath's hotspot.
    await page.goto('/world/sindhu-ghati?spawn=352,700');

    await expect(page.getByTestId('aru-walk')).toBeVisible();
    const prompt = page.getByTestId('walk-prompt');
    await expect(prompt).toBeVisible();
    await expect(prompt).toContainText('Vishaal Snanagar');

    // Regression: keyboard focus sitting on a hotspot button must not
    // swallow the walk keys (E still reaches the engine).
    await page.getByRole('button', { name: 'Vishaal Snanagar' }).focus();
    await page.keyboard.press('e');
    await expect(page.getByRole('dialog', { name: 'Vishaal Snanagar' })).toBeVisible();

    await page.getByRole('button', { name: 'Band karo' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // Input re-enabled after the card closes: Aru hasn't moved, prompt is back.
    await expect(prompt).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test('village walking: standing near a villager opens their bubble without hover', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    // Spawn on the drain street right next to its resident NPC.
    await page.goto('/world/sindhu-ghati?spawn=512,1000');

    await expect(page.getByTestId('aru-walk')).toBeVisible();
    await expect(page.getByTestId('npc-bubble-drain-street-resident')).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  for (const game of [
    {
      id: 'drain-puzzle',
      title: 'Naali Paheli',
      subtitle: 'Paani ko Raasta Do',
      objective: 'Naali jodo — 0/5',
      hint: 'naali ke tukde dhoondo',
    },
    {
      id: 'city-builder',
      title: 'Sheher Banao',
      subtitle: 'Naya Mohalla',
      objective: 'Sheher banao — 0/6',
      hint: 'E ya Space se uthao',
    },
  ]) {
    test(`loads and starts the ${game.title} game screen`, async ({ page }) => {
      const runtimeErrors = collectRuntimeErrors(page);

      await page.goto(`/world/sindhu-ghati/game/${game.id}`);

      await expect(page).toHaveURL(`/world/sindhu-ghati/game/${game.id}`);
      await expect(
        page.getByLabel(
          `${game.title} — 2D khel. Chalne ke liye WASD ya arrow keys, uthane-rakhne ke liye E ya Space.`,
        ),
      ).toBeVisible();

      const intro = page.getByRole('dialog');
      await expect(intro.getByRole('heading', { name: game.title })).toBeVisible();
      await expect(intro.getByText(game.subtitle, { exact: true })).toBeVisible();

      const start = intro.getByRole('button', { name: '▶ Shuru Karo' });
      await expect(start).toBeEnabled();
      await start.click();

      await expect(intro).toBeHidden();
      await expect(page.getByText(game.objective)).toBeVisible();
      await expect(page.getByRole('status')).toContainText(game.hint);
      await expect(page.getByRole('button', { name: '⏸ Roko (Esc)' })).toBeVisible();
      expect(runtimeErrors).toEqual([]);
    });
  }
});

/**
 * A save where Sindhu Ghati and Apni Parampara are fully restored — the
 * derived unlock rules then open Magadha Kaal (Sindhu ≥60%), Kala Bhoomi
 * (Parampara 100%) and Khel Maidan (2 explored). Node entries are partial on
 * purpose: the loader merges them over config defaults.
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

test.describe('Region worlds & finale games', () => {
  test('a fresh save keeps the other regions locked (world route bounces home)', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    await page.goto('/world/magadha-kaal');

    // Bounces to the hub with the locked node selected, so the panel explains
    // WHY the gate is shut instead of silently dropping the player home.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Rajgir–Pataliputra' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Locked', exact: true })).toBeDisabled();
    await expect(page.getByText('Yeh dwar abhi bandh hai')).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test('a climax building card launches its finale game', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await seedUnlockedSave(page);

    await page.goto('/world/magadha-kaal?at=300');
    await page.getByRole('button', { name: /Pothi Khoj — The Manuscript Hunt/ }).click();

    const card = page.getByRole('dialog', { name: 'Pothi Khoj' });
    await expect(card).toBeVisible();
    await expect(card.getByText('Is kshetra ki sabse badi yaad yahin chhupi hai')).toBeVisible();

    await card.getByRole('button', { name: 'Khel Shuru Karo' }).click();

    await expect(page).toHaveURL(/\/world\/magadha-kaal\/game\/pothi-khoj$/);
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Pothi Khoj' })).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test('winning both Sindhu games unlocks Magadha through normal play, and it survives reload', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    // Exactly what markBuildingComplete persists after winning the two Sindhu
    // games — no node statuses or percentages are tampered with.
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'bharatverse-state',
        JSON.stringify({ v: 3, completedBuildings: { 'sindhu-ghati': ['naali-paheli', 'sheher-banao'] } }),
      );
    });

    await page.goto('/');
    // Exact label without the "(locked)" suffix — the gate is derived open.
    await page.getByRole('button', { name: 'Magadha Kaal — Seat of Ancient Wisdom', exact: true }).click();
    await expect(page).toHaveURL(/\/world\/magadha-kaal$/);
    await expect(page.getByText('Gyan ki dharti Nalanda me swagat hai, Aru.')).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/world\/magadha-kaal$/);
    await expect(page.getByLabel('Village — scroll ya drag karke ghoomo')).toBeVisible();
    // Non-walk worlds keep classic panning — no Aru sprite here.
    await expect(page.getByTestId('aru-walk')).toHaveCount(0);
    expect(runtimeErrors).toEqual([]);
  });

  test('restoring Sindhu + Parampara unlocks Magadha and opens its world', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await seedUnlockedSave(page);

    await page.goto('/');
    await page.getByRole('button', { name: /Magadha Kaal — Seat of Ancient Wisdom/ }).click();

    await expect(page).toHaveURL(/\/world\/magadha-kaal$/);
    await expect(
      page.getByLabel('Village — scroll ya drag karke ghoomo'),
    ).toBeVisible();
    await expect(page.getByText('Gyan ki dharti Nalanda me swagat hai, Aru.')).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  for (const game of [
    {
      id: 'pothi-khoj',
      nodeId: 'magadha-kaal',
      title: 'Pothi Khoj',
      subtitle: 'Gyan ka Bhandaar',
      objective: 'Pothiyan rakho — 0/6',
      hint: 'pothiyan dhoondo',
    },
    {
      id: 'rangoli-rang',
      nodeId: 'kala-bhoomi',
      title: 'Rangoli Rang',
      subtitle: 'Aangan ke Rang',
      objective: 'Rangoli bharo — 0/6',
      hint: 'rang ke matke',
    },
    {
      id: 'diye-jalao',
      nodeId: 'apni-parampara',
      title: 'Diye Jalao',
      subtitle: 'Roshni ki Raat',
      objective: 'Diye jalao — 0/6',
      hint: 'jyot se lau',
    },
    {
      id: 'kho-kho-daud',
      nodeId: 'khel-maidan',
      title: 'Kho-Kho Daud',
      subtitle: 'Khambon ki Race',
      objective: 'Khambe chhuo — 0/8',
      hint: 'chamakte khambe',
    },
  ]) {
    test(`loads and starts the ${game.title} finale`, async ({ page }) => {
      const runtimeErrors = collectRuntimeErrors(page);
      await seedUnlockedSave(page);

      await page.goto(`/world/${game.nodeId}/game/${game.id}`);

      await expect(page).toHaveURL(`/world/${game.nodeId}/game/${game.id}`);
      await expect(
        page.getByLabel(
          `${game.title} — 2D khel. Chalne ke liye WASD ya arrow keys, uthane-rakhne ke liye E ya Space.`,
        ),
      ).toBeVisible();

      const intro = page.getByRole('dialog');
      await expect(intro.getByRole('heading', { name: game.title })).toBeVisible();
      await expect(intro.getByText(game.subtitle, { exact: true })).toBeVisible();

      const start = intro.getByRole('button', { name: '▶ Shuru Karo' });
      await expect(start).toBeEnabled();
      await start.click();

      await expect(intro).toBeHidden();
      await expect(page.getByText(game.objective)).toBeVisible();
      await expect(page.getByRole('status')).toContainText(game.hint);
      expect(runtimeErrors).toEqual([]);
    });
  }
});