const PII_PATTERNS = [
  /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i,
  /\b(?:\+?\d[\s.-]?){7,15}\b/,
  /\bhttps?:\/\/|\bwww\./i,
  /\b(?:my name is|mera naam|main rehta|main rehti|i live at|my address|my school|mere school)\b/i,
];

const PROMPT_ATTACK_PATTERNS = [
  /\b(?:ignore|forget|bypass|override)\b.{0,40}\b(?:instructions?|prompt|rules?|safety)\b/i,
  /\b(?:system prompt|developer message|jailbreak|do anything now|\bdan\b)\b/i,
  /\b(?:pretend|roleplay|act as)\b.{0,45}\b(?:unrestricted|evil|adult|uncensored)\b/i,
];

const UNSAFE_PATTERNS = [
  /\b(?:porn|sexual|nude|naked|suicide|self[- ]?harm|drugs?|cocaine|heroin|weapon|bomb|gun)\b/i,
  /\b(?:password|api key|secret key|credit card|otp)\b/i,
];

const HERITAGE_TOPIC =
  /\b(?:bharat|india|indian|itihas|history|historical|heritage|culture|cultural|ancient|purana|purani|sabhyata|civilization|archaeology|sindhu|indus|harappa|mohenjo|ashoka|maurya|gupta|magadha|nalanda|raja|rani|king|queen|empire|samrajya|mandir|temple|fort|qila|monument|mahal|taj|rangoli|diya|festival|tyohar|dance|nritya|music|sangeet|kho[- ]?kho|art|kala|craft|lipi|script|seal|trade|bazaar|snan|bath|drain|naali|city|sheher|village|gaon|smriti|aru|time rift|bharatverse)\b/i;

export type GuideSafetyResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

export function checkGuideQuestion(question: string): GuideSafetyResult {
  const value = question.trim();
  if (PII_PATTERNS.some(pattern => pattern.test(value))) {
    return {
      ok: false,
      message:
        "Apni personal details share mat karo. Sirf Bharat ki history ya culture ka sawal poochho.",
    };
  }
  if (
    PROMPT_ATTACK_PATTERNS.some(pattern => pattern.test(value)) ||
    UNSAFE_PATTERNS.some(pattern => pattern.test(value))
  ) {
    return {
      ok: false,
      message:
        "Main sirf safe BharatVerse, history aur culture ke sawalon mein madad kar sakti hoon.",
    };
  }
  if (!HERITAGE_TOPIC.test(value)) {
    return {
      ok: false,
      message:
        "Yeh Time Rift Bharat ki history aur culture ke raaz dhoondhta hai. Unmein se kuch poochho!",
    };
  }
  return { ok: true, value };
}

export function safeGuideAnswer(answer: string): string {
  const value = answer.trim().slice(0, 600);
  if (
    value.length < 2 ||
    PII_PATTERNS.some(pattern => pattern.test(value)) ||
    UNSAFE_PATTERNS.some(pattern => pattern.test(value))
  ) {
    return "Is raaz ka safe jawab abhi nahi mila. BharatVerse ki kisi doosri discovery ke baare mein poochho.";
  }
  return value;
}