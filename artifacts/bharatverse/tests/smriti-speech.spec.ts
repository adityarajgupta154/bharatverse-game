import { expect, test, type Page } from '@playwright/test';
import { installTtsStub, ttsState } from './tts-stub';

function collectRuntimeErrors(page: Page) {
  const errors: Error[] = [];
  page.on('pageerror', error => errors.push(error));
  return errors;
}

/**
 * Smriti's OTHER speech surfaces (beyond discovery cards): the HUD dialogue
 * box's painted speaker glyph is now a real listen button (hub + village),
 * and BuildingCard reads its invite/locked explanation. Also proves the
 * app-wide one-voice rule: starting one reading force-ends the previous
 * one's UI state (speech.ts session registry), never leaving a stuck Roko.
 */
test.describe('Smriti HUD & building-card speech', () => {
  test.beforeEach(async ({ page }) => {
    await installTtsStub(page);
  });

  test('hub: the painted speaker glyph reads the current line and toggles off', async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/');

    const hud = page.getByTestId('smriti-listen');
    await expect(hud).toBeVisible();
    await expect(hud).toHaveAttribute('aria-pressed', 'false');

    await hud.click();
    await expect(hud).toHaveAttribute('aria-pressed', 'true');
    let s = await ttsState(page);
    expect(s.spoken).toBe(1);
    expect(s.first.length).toBeGreaterThan(10); // the full line, not the typing partial
    const cancelsAfterPlay = s.cancels;

    await hud.click(); // Roko
    await expect(hud).toHaveAttribute('aria-pressed', 'false');
    s = await ttsState(page);
    expect(s.cancels).toBeGreaterThan(cancelsAfterPlay);

    expect(runtimeErrors).toEqual([]);
  });

  test('village: HUD reads, BuildingCard reads its invite, and only one voice speaks at a time', async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    await page.goto('/world/sindhu-ghati?spawn=352,700');
    await page.getByTestId('walk-prompt').filter({ hasText: 'Vishaal Snanagar' }).waitFor();

    // Village HUD line is voiced too (same component as the hub).
    const hud = page.getByTestId('smriti-listen');
    await hud.click();
    await expect(hud).toHaveAttribute('aria-pressed', 'true');
    let s = await ttsState(page);
    expect(s.spoken).toBe(1);

    // Open the Great Bath's activation card.
    await page.keyboard.press('e');
    const cardListen = page.getByTestId('building-listen');
    await expect(cardListen).toBeVisible();

    // Card reads the building's invite line (from the content registry).
    await cardListen.click();
    await expect(cardListen).toHaveAttribute('aria-pressed', 'true');
    s = await ttsState(page);
    expect(s.last).toContain('Chamakti seedhiyan'); // great-bath invite
    // One voice app-wide: the HUD's session was force-ended, not stranded.
    await expect(hud).toHaveAttribute('aria-pressed', 'false');

    // Closing the card stops the reading (unmount cleanup).
    const cancelsBeforeClose = s.cancels;
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect
      .poll(async () => (await ttsState(page)).cancels)
      .toBeGreaterThan(cancelsBeforeClose);

    // The HUD control still works after losing a takeover (replayable).
    await hud.click();
    await expect(hud).toHaveAttribute('aria-pressed', 'true');

    expect(runtimeErrors).toEqual([]);
  });

  test('pregenerated audio and live TTS share the one-voice rule', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.goto('/world/sindhu-ghati?spawn=352,700');
    await page.getByTestId('walk-prompt').filter({ hasText: 'Vishaal Snanagar' }).waitFor();
    await page.evaluate(() => {
      window.__tts.audio.mode = 'play';
    });

    // Didi starts reading the HUD line via live TTS…
    const hud = page.getByTestId('smriti-listen');
    await hud.click();
    await expect(hud).toHaveAttribute('aria-pressed', 'true');
    let s = await ttsState(page);
    expect(s.spoken).toBe(1);
    const cancelsBefore = s.cancels;

    // …then the discovery card's PREGENERATED narration takes the voice:
    // the TTS session is silenced (engine cancel) and its button resets.
    await page.keyboard.press('e');
    await page.getByRole('button', { name: /Khoj Shuru Karo|Phir Se Dekho/ }).click();
    const cardListen = page.getByTestId('discovery-listen');
    await cardListen.click();
    await expect(cardListen).toHaveAttribute('aria-pressed', 'true');
    s = await ttsState(page);
    expect(s.audioPlays).toBe(1);
    expect(s.lastAudioSrc).toContain('great-bath');
    expect(s.spoken).toBe(1); // no new utterances — reading moved to audio
    expect(s.cancels).toBeGreaterThan(cancelsBefore); // TTS engine silenced
    await expect(hud).toHaveAttribute('aria-pressed', 'false');

    // And the reverse: live TTS (card close → HUD) pauses the audio file.
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape'); // fact card, then activation card if present
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect
      .poll(async () => (await ttsState(page)).audioPauses)
      .toBeGreaterThan(0); // unmount/stop paused the file

    expect(runtimeErrors).toEqual([]);
  });
});
