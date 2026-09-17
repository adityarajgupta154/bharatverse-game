import type { NextFunction, Request, Response } from "express";

type WindowState = { count: number; resetAt: number; active: number };
const windows = new Map<string, WindowState>();
let globalActive = 0;

const WINDOW_MS = 10 * 60 * 1000;
const GLOBAL_CONCURRENCY = 4;

function clientKey(req: Request): string {
  return req.socket.remoteAddress || "proxy";
}

function allowedOrigin(): string | null {
  if (process.env.NODE_ENV === "production") {
    return process.env["APP_ORIGIN"] ?? null;
  }
  const domain = process.env["REPLIT_DEV_DOMAIN"];
  return domain ? `https://${domain}` : "http://localhost";
}

export function requireAiAvailability(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (
    process.env.NODE_ENV === "production" &&
    process.env["SARVAM_AI_PUBLIC"] !== "true"
  ) {
    res.status(503).json({
      error: "AI Guide public release mein abhi band hai.",
    });
    return;
  }
  next();
}

export function requireSameOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const origin = req.get("origin");
  const expectedOrigin = allowedOrigin();
  if (!origin || !expectedOrigin) {
    res.status(403).json({ error: "Request origin verify nahi ho saka." });
    return;
  }

  try {
    if (new URL(origin).origin !== new URL(expectedOrigin).origin) {
      res.status(403).json({ error: "Yeh request BharatVerse se nahi aayi." });
      return;
    }
  } catch {
    res.status(403).json({ error: "Request origin valid nahi hai." });
    return;
  }
  next();
}

export function limitAiRequests(limit: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = clientKey(req);
    let state = windows.get(key);
    if (!state || now >= state.resetAt) {
      state = { count: 0, resetAt: now + WINDOW_MS, active: 0 };
      windows.set(key, state);
    }

    if (
      state.count >= limit ||
      state.active >= 2 ||
      globalActive >= GLOBAL_CONCURRENCY
    ) {
      const retrySeconds = Math.max(1, Math.ceil((state.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retrySeconds));
      res.status(429).json({
        error: "Time Rift ko thoda aaram chahiye. Kuch der baad phir poochho.",
      });
      return;
    }

    state.count += 1;
    state.active += 1;
    globalActive += 1;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      state.active = Math.max(0, state.active - 1);
      globalActive = Math.max(0, globalActive - 1);
    };
    res.once("finish", release);
    res.once("close", release);
    next();
  };
}