import { Router, type IRouter } from "express";
import {
  AskSarvamGuideBody,
  AskSarvamGuideResponse,
  CreateSarvamSpeechBody,
  CreateSarvamSpeechResponse,
  TranscribeSarvamAudioBody,
  TranscribeSarvamAudioResponse,
} from "@workspace/api-zod";
import {
  askBharatVerseGuide,
  createBharatVerseSpeech,
  transcribeBharatVerseAudio,
} from "../lib/sarvam";
import { checkGuideQuestion, safeGuideAnswer } from "../lib/ai-safety";
import {
  limitAiRequests,
  requireAiAvailability,
  requireSameOrigin,
} from "../middlewares/ai-guard";

const router: IRouter = Router();

const GUIDE_SUGGESTIONS = [
  "Mohenjo-Daro kitna purana hai?",
  "Sindhu lipi abhi tak mystery kyun hai?",
  "Great Bath ka use kisliye hota tha?",
];

router.post(
  "/sarvam/guide",
  requireAiAvailability,
  requireSameOrigin,
  limitAiRequests(12),
  async (req, res): Promise<void> => {
    const parsed = AskSarvamGuideBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Sawal 2 se 300 characters ka hona chahiye." });
      return;
    }

    const safeQuestion = checkGuideQuestion(parsed.data.question);
    if (!safeQuestion.ok) {
      res.status(400).json({ error: safeQuestion.message });
      return;
    }

    try {
      const answer = safeGuideAnswer(
        await askBharatVerseGuide(safeQuestion.value),
      );
      res.json(
        AskSarvamGuideResponse.parse({
          answer,
          suggestions: GUIDE_SUGGESTIONS,
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, "Sarvam guide request failed");
      res.status(502).json({
        error: "Smriti Didi abhi Time Rift se connect nahi kar paa rahi hain.",
      });
    }
  },
);

router.post(
  "/sarvam/speech",
  requireAiAvailability,
  requireSameOrigin,
  limitAiRequests(24),
  async (req, res): Promise<void> => {
    const parsed = CreateSarvamSpeechBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Narration text valid nahi hai." });
      return;
    }

    try {
      const audioBase64 = await createBharatVerseSpeech(parsed.data.text.trim());
      res.json(
        CreateSarvamSpeechResponse.parse({
          audioBase64,
          mimeType: "audio/wav",
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, "Sarvam speech request failed");
      res.status(502).json({
        error: "Sarvam narration abhi available nahi hai.",
      });
    }
  },
);

router.post(
  "/sarvam/transcribe",
  requireAiAvailability,
  requireSameOrigin,
  limitAiRequests(6),
  async (req, res): Promise<void> => {
    const parsed = TranscribeSarvamAudioBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Voice sawal ki recording valid nahi hai." });
      return;
    }

    try {
      const transcript = await transcribeBharatVerseAudio(
        parsed.data.audioBase64,
        parsed.data.mimeType,
      );
      res.json(TranscribeSarvamAudioResponse.parse({ transcript }));
    } catch (error) {
      req.log.error({ err: error }, "Sarvam transcription request failed");
      res.status(502).json({
        error: "Smriti Didi awaaz ko samajh nahi paayi. Phir se bolo.",
      });
    }
  },
);

export default router;