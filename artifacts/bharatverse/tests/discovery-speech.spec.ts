import { expect, test, type Page } from '@playwright/test';
import { installTtsStub, ttsState } from './tts-stub';

function collectRuntimeErrors(page: Page) {
  const errors: Error[] = [];
  page.on('pageerror', error => errors.push(error));
  return errors;
}

/**
 * Smriti reads discovery cards aloud (FactCard's "Suno" control). Real TTS
 * can't be asserted headlessly, so the spec installs the shared recorder
 * stub (tts-stub.ts) BEFORE the app loads and asserts the wiring end to
 * end: play queues the registry-derived narration, stop cancels, replay
 * re-queues, and closing the card cancels whatever is still speaking.
 */
/** Walk to the Great Bath doorstep and open its discovery (fact card). */
async function openGreatBathCard(page: Page) {
  await page.goto('/world/sindhu-ghati?spawn=352,700');
  await page.getByTestId('walk-prompt').filter({ hasText: 'Vishaal Snanagar' }).waitFor();
  await page.keyboard.press('e');
  await page.getByRole('button', { name: /Khoj Shuru Karo|Phir Se Dekho/ }).click();
  const listen = page.getByTestId('discovery-listen');
  await expect(listen).toBeVisible();
  return listen;
}

test.describe('discovery cards: Smriti reads aloud', () => {
  test.beforeEach(async ({ page }) => {
    await installTtsStub(page);
  });

  test('Suno queues the card narration; Roko, replay, and card-close all stop it', async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page);

    const listen = await openGreatBathCard(page);
    await expect(listen).toContainText('Suno');

    // Play: the whole card is queued from the content registry —
    // intro + 3 sections + fun fact = 5 utterances for great-bath.
    await listen.click();
    await expect(listen).toContainText('Roko');
    await expect(listen).toHaveAttribute('aria-pressed', 'true');
    let s = await ttsState(page);
    expect(s.spoken).toBe(5);
    expect(s.first).toContain('duniya ka sabse purana sarvajanik snanagar');
    expect(s.all).toContain('Kya jaante ho?');
    const cancelsAfterPlay = s.cancels; // speakParts pre-cancels once per session

    // Stop: cancel reaches the engine, button returns to Suno.
    await listen.click();
    await expect(listen).toContainText('Suno');
    await expect(listen).toHaveAttribute('aria-pressed', 'false');
    s = await ttsState(page);
    expect(s.cancels).toBeGreaterThan(cancelsAfterPlay);

    // Replay works: a second session queues the same 5 parts again.
    await listen.click();
    await expect(listen).toContainText('Roko');
    s = await ttsState(page);
    expect(s.spoken).toBe(10);
    const cancelsBeforeClose = s.cancels;

    // Closing the card mid-speech stops Smriti (unmount cleanup cancels).
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect
      .poll(async () => (await ttsState(page)).cancels)
      .toBeGreaterThan(cancelsBeforeClose);

    expect(runtimeErrors).toEqual([]);
  });

  test('the button resets by itself when didi finishes reading (final onend)', async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    const listen = await openGreatBathCard(page);

    await listen.click();
    await expect(listen).toContainText('Roko');
    await expect(listen).toHaveAttribute('aria-pressed', 'true');

    // The engine finishes the queue naturally — the app only listens on the
    // FINAL utterance's onend, and the button must reset with no user action.
    expect(await page.evaluate(() => window.__tts.fireLastOnEnd())).toBe(true);
    await expect(listen).toContainText('Suno');
    await expect(listen).toHaveAttribute('aria-pressed', 'false');

    // A fresh reading still works after natural completion (session cleared).
    await listen.click();
    await expect(listen).toContainText('Roko');
    expect((await ttsState(page)).spoken).toBe(10);

    expect(runtimeErrors).toEqual([]);
  });

  test('plays the pregenerated storyteller audio when the card has it (no TTS)', async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    const listen = await openGreatBathCard(page);
    await page.evaluate(() => {
      window.__tts.audio.mode = 'play';
    });

    // Reading runs on the pregenerated file — the live TTS engine stays idle.
    await listen.click();
    await expect(listen).toContainText('Roko');
    let s = await ttsState(page);
    expect(s.audioPlays).toBe(1);
    expect(s.lastAudioSrc).toContain('great-bath');
    expect(s.spoken).toBe(0);

    // The file finishing naturally resets the button, and replay works.
    expect(await page.evaluate(() => window.__tts.audio.fireEnded())).toBe(true);
    await expect(listen).toContainText('Suno');
    await expect(listen).toHaveAttribute('aria-pressed', 'false');
    await listen.click();
    await expect(listen).toContainText('Roko');
    s = await ttsState(page);
    expect(s.audioPlays).toBe(2);
    expect(s.spoken).toBe(0);

    expect(runtimeErrors).toEqual([]);
  });

  test('falls back to live TTS when the pregenerated audio cannot start', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    const listen = await openGreatBathCard(page);
    // Default stub mode 'reject' = the file never starts (offline cache
    // miss / autoplay block). The button must stay in one steady speaking
    // state while didi's live voice takes over seamlessly.
    await listen.click();
    await expect(listen).toContainText('Roko');
    await expect.poll(async () => (await ttsState(page)).spoken).toBe(5);
    const s = await ttsState(page);
    expect(s.audioPlays).toBe(1); // the audio path was attempted first
    expect(s.first).toContain('Beech sheher me chamakta vishaal kund');
    expect(runtimeErrors).toEqual([]);
  });

  test('voices arriving late (voiceschanged race) neither crashes nor strands the reading', async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    const listen = await openGreatBathCard(page);

    // getVoices() is empty at speak time (the stub's default — mirrors
    // Chrome's async voice loading), so speech starts voiceless and the app
    // registers a one-shot 'voiceschanged' listener.
    await listen.click();
    await expect(listen).toContainText('Roko');
    const notified = await page.evaluate(() =>
      window.__tts.fireVoicesChanged([{ lang: 'en-IN', name: 'Test Didi' }])
    );
    expect(notified).toBeGreaterThan(0);

    // Voices landing mid-reading breaks nothing: the queue keeps playing and
    // natural completion still resets the button.
    expect(await page.evaluate(() => window.__tts.fireLastOnEnd())).toBe(true);
    await expect(listen).toContainText('Suno');
    await expect(listen).toHaveAttribute('aria-pressed', 'false');

    expect(runtimeErrors).toEqual([]);
  });
});
