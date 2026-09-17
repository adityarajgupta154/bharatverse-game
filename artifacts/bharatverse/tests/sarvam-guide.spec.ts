import { test, expect } from '@playwright/test';

test.describe('Sarvam AI heritage guide', () => {
  test('opens from the painted Oracle prompt, answers, and closes with Escape', async ({
    page,
  }) => {
    await page.route('**/api/sarvam/guide', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer:
            'Mohenjo-Daro ki naaliyan pakki eenton se bani thi aur kai gharon ko covered drains se jodti thi.',
          suggestions: [
            'Great Bath kya tha?',
            'Sindhu lipi kyun nahi padhi gayi?',
          ],
        }),
      })
    );

    await page.goto('/oracle');
    await expect(page.getByTestId('oracle-guide')).toHaveCount(0);
    await page.getByRole('button', { name: 'Sarvam AI Guide kholo' }).click();
    await expect(page.getByTestId('oracle-guide')).toBeVisible();

    await page
      .getByRole('button', { name: /Mohenjo-Daro kitna purana/i })
      .click();
    await expect(page.getByText(/naaliyan pakki eenton/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /suno/i })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('oracle-guide')).toHaveCount(0);
  });

  test('shows Sarvam failures as a recoverable error', async ({ page }) => {
    await page.route('**/api/sarvam/guide', route =>
      route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Smriti Didi abhi connect nahi kar paa rahi hain.',
        }),
      })
    );

    await page.goto('/oracle');
    await page.getByRole('button', { name: 'Sarvam AI Guide kholo' }).click();
    await page
      .getByRole('button', { name: /Mohenjo-Daro kitna purana/i })
      .click();

    await expect(page.getByText(/connect nahi kar paa rahi/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Phir Poochho/i })).toBeVisible();
  });

  test('closing during a request discards the late answer', async ({ page }) => {
    await page.route('**/api/sarvam/guide', async route => {
      await new Promise(resolve => setTimeout(resolve, 600));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: 'Yeh jawab band panel mein kabhi dikhna nahi chahiye.',
          suggestions: ['Great Bath kya tha?', 'Sindhu lipi kya thi?'],
        }),
      });
    });

    await page.goto('/oracle');
    await page.getByRole('button', { name: 'Sarvam AI Guide kholo' }).click();
    await page
      .getByRole('button', { name: /Mohenjo-Daro kitna purana/i })
      .click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);

    await page.getByRole('button', { name: 'Sarvam AI Guide kholo' }).click();
    await expect(page.getByText(/band panel mein kabhi/i)).toHaveCount(0);
    await expect(page.getByText(/Bharat ke kis raaz/i)).toBeVisible();
  });

  test('leaving the Oracle stops recording without uploading audio', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      type VoiceTestWindow = Window & { __voiceTrackStopped?: boolean };
      const voiceWindow = window as VoiceTestWindow;
      voiceWindow.__voiceTrackStopped = false;

      const track = {
        stop: () => {
          voiceWindow.__voiceTrackStopped = true;
        },
      } as MediaStreamTrack;
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () =>
            ({
              getTracks: () => [track],
            }) as MediaStream,
        },
      });

      class FakeMediaRecorder {
        static isTypeSupported() {
          return true;
        }

        state: RecordingState = 'inactive';
        mimeType = 'audio/webm';
        ondataavailable: ((event: BlobEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        onstop: ((event: Event) => void) | null = null;

        start() {
          this.state = 'recording';
        }

        stop() {
          this.state = 'inactive';
          this.ondataavailable?.({
            data: new Blob(['recorded voice'], { type: this.mimeType }),
          } as BlobEvent);
          this.onstop?.(new Event('stop'));
        }
      }

      Object.defineProperty(window, 'MediaRecorder', {
        configurable: true,
        value: FakeMediaRecorder,
      });
    });

    let transcriptionRequests = 0;
    await page.route('**/api/sarvam/transcribe', route => {
      transcriptionRequests += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ transcript: 'Yeh upload nahi hona chahiye.' }),
      });
    });

    await page.goto('/oracle');
    await page.getByRole('button', { name: 'Sarvam AI Guide kholo' }).click();
    const microphone = page.getByRole('button', {
      name: 'Microphone se sawal bolo',
    });
    await microphone.focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('button', { name: 'Sawal bolna band karo' }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Wapas Naksha' }).click();
    await expect(page).toHaveURL('/');
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { __voiceTrackStopped?: boolean })
              .__voiceTrackStopped,
        ),
      )
      .toBe(true);
    await page.waitForTimeout(100);
    expect(transcriptionRequests).toBe(0);
  });
});