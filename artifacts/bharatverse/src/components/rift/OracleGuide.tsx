import { useState, useRef, useEffect } from 'react';
import {
  transcribeSarvamAudio,
  useAskSarvamGuide,
  type ApiError,
} from '@workspace/api-client-react';
import { useSpeech } from '@/lib/useSpeech';
import {
  Sparkles,
  Volume2,
  Square,
  AlertCircle,
  CornerDownRight,
  ArrowUpRight,
  X,
  Mic,
  LoaderCircle,
  RotateCcw,
} from 'lucide-react';

type GuideState = 
  | { type: 'idle' }
  | { type: 'loading'; question: string }
  | { type: 'error'; question: string; error: string }
  | { type: 'answered'; question: string; answer: string; suggestions: string[] };

const DEFAULT_SUGGESTIONS = [
  'Mohenjo-Daro kitna purana hai?',
  'Sindhu lipi abhi tak mystery kyun hai?',
  'Great Bath ka use kisliye hota tha?',
];

const RECORDING_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
] as const;
const MAX_RECORDING_MS = 20_000;
const MAX_RECORDING_BYTES = 1_800_000;

type RecordingMimeType =
  | 'audio/webm'
  | 'audio/ogg'
  | 'audio/wav'
  | 'audio/mp4'
  | 'audio/mpeg';

type VoiceState = 'idle' | 'requesting' | 'listening' | 'processing' | 'error';

function guideErrorMessage(error: unknown): string {
  const apiError = error as { data?: ApiError | null };
  return apiError.data?.error ?? 'Time Rift abhi shaant hai. Phir se poochho.';
}

export function OracleGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [guideState, setGuideState] = useState<GuideState>({ type: 'idle' });
  const [inputValue, setInputValue] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceError, setVoiceError] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const requestControllerRef = useRef(new AbortController());
  const requestSequenceRef = useRef(0);
  const voiceControllerRef = useRef<AbortController | null>(null);
  const voiceSequenceRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);

  const askGuide = useAskSarvamGuide({
    request: { signal: requestControllerRef.current.signal },
  });
  const { speaking, toggle, stop } = useSpeech();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);

  const disposeVoiceCapture = () => {
    voiceSequenceRef.current += 1;
    voiceControllerRef.current?.abort();
    voiceControllerRef.current = null;
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onerror = null;
      recorder.onstop = null;
      if (recorder.state !== 'inactive') recorder.stop();
    }

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
  };

  // Scroll to top on state change to ensure content is visible
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [guideState.type, guideState, voiceTranscript]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (voiceTranscript) transcriptRef.current?.focus();
  }, [voiceTranscript]);

  useEffect(
    () => () => {
      requestSequenceRef.current += 1;
      requestControllerRef.current.abort();
      disposeVoiceCapture();
    },
    []
  );

  const closeGuide = () => {
    requestSequenceRef.current += 1;
    requestControllerRef.current.abort();
    requestControllerRef.current = new AbortController();
    disposeVoiceCapture();
    stop();
    setGuideState({ type: 'idle' });
    setInputValue('');
    setVoiceState('idle');
    setVoiceError('');
    setVoiceTranscript('');
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closeGuide();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
    // `stop` is intentionally captured only when the panel opens; the shared
    // voice-session handle it reaches remains current across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = (q: string): boolean => {
    if (!q.trim() || q.length < 2) return false;

    const requestSequence = ++requestSequenceRef.current;
    stop();
    setInputValue('');
    setGuideState({ type: 'loading', question: q });
    
    askGuide.mutate(
      { data: { question: q } },
      {
        onSuccess: (data) => {
          if (requestSequence !== requestSequenceRef.current) return;
          setGuideState({
            type: 'answered',
            question: q,
            answer: data.answer,
            suggestions: data.suggestions || [],
          });
        },
        onError: (err) => {
          if (requestSequence !== requestSequenceRef.current) return;
          setGuideState({
            type: 'error',
            question: q,
            error: guideErrorMessage(err),
          });
        }
      }
    );
    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(inputValue);
  };

  const toBase64 = async (blob: Blob): Promise<string> => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(
        ...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)),
      );
    }
    return window.btoa(binary);
  };

  const normalizedMimeType = (mimeType: string): RecordingMimeType => {
    const baseMimeType = mimeType.split(';', 1)[0];
    if (
      baseMimeType === 'audio/webm' ||
      baseMimeType === 'audio/ogg' ||
      baseMimeType === 'audio/wav' ||
      baseMimeType === 'audio/mp4' ||
      baseMimeType === 'audio/mpeg'
    ) {
      return baseMimeType;
    }
    return 'audio/webm';
  };

  const startVoiceQuestion = async () => {
    if (voiceState === 'requesting' || voiceState === 'listening' || voiceState === 'processing') {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError('Is device par microphone recording available nahi hai.');
      setVoiceState('error');
      return;
    }

    const voiceSequence = ++voiceSequenceRef.current;
    setVoiceError('');
    setVoiceTranscript('');
    setVoiceState('requesting');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      if (voiceSequence !== voiceSequenceRef.current) return;
      setVoiceError('Microphone permission allow karke phir se bolo.');
      setVoiceState('error');
      return;
    }

    if (voiceSequence !== voiceSequenceRef.current || !isOpen) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }

    const supportedType = RECORDING_MIME_TYPES.find(type =>
      typeof MediaRecorder.isTypeSupported === 'function'
        ? MediaRecorder.isTypeSupported(type)
        : false,
    );
    let recorder: MediaRecorder;
    try {
      recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach(track => track.stop());
      setVoiceError('Is browser mein microphone recording shuru nahi ho paayi.');
      setVoiceState('error');
      return;
    }
    const chunks: BlobPart[] = [];
    mediaStreamRef.current = stream;
    recorderRef.current = recorder;
    recorder.ondataavailable = event => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => {
      if (voiceSequence !== voiceSequenceRef.current) return;
      if (recordingTimeoutRef.current !== null) {
        window.clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      stream.getTracks().forEach(track => track.stop());
      setVoiceError('Recording mein dikkat aa gayi. Phir se koshish karo.');
      setVoiceState('error');
    };
    recorder.onstop = async () => {
      if (recordingTimeoutRef.current !== null) {
        window.clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      stream.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      recorderRef.current = null;
      if (voiceSequence !== voiceSequenceRef.current) return;

      const blob = new Blob(chunks, {
        type: recorder.mimeType || supportedType || 'audio/webm',
      });
      if (blob.size === 0 || blob.size > MAX_RECORDING_BYTES) {
        setVoiceError('Awaaz record nahi hui. Mic ko paas laakar phir bolo.');
        setVoiceState('error');
        return;
      }

      setVoiceState('processing');
      const controller = new AbortController();
      voiceControllerRef.current = controller;
      try {
        const transcript = await transcribeSarvamAudio(
          {
            audioBase64: await toBase64(blob),
            mimeType: normalizedMimeType(recorder.mimeType || 'audio/webm'),
          },
          { signal: controller.signal },
        );
        if (voiceSequence !== voiceSequenceRef.current) return;
        setVoiceTranscript(transcript.transcript);
        setVoiceState('idle');
      } catch {
        if (voiceSequence !== voiceSequenceRef.current || controller.signal.aborted) return;
        setVoiceError('Smriti Didi awaaz ko samajh nahi paayi. Phir se bolo.');
        setVoiceState('error');
      } finally {
        if (voiceControllerRef.current === controller) voiceControllerRef.current = null;
      }
    };

    try {
      recorder.start();
    } catch {
      recorderRef.current = null;
      mediaStreamRef.current = null;
      stream.getTracks().forEach(track => track.stop());
      setVoiceError('Recording shuru nahi ho paayi. Phir se koshish karo.');
      setVoiceState('error');
      return;
    }
    recordingTimeoutRef.current = window.setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
        setVoiceState('processing');
      }
    }, MAX_RECORDING_MS);
    setVoiceState('listening');
  };

  const stopVoiceQuestion = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      setVoiceState('processing');
    }
  };

  const sendVoiceQuestion = () => {
    if (handleSubmit(voiceTranscript)) {
      setVoiceTranscript('');
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        aria-label="Sarvam AI Guide kholo"
        data-testid="oracle-guide-open"
        onClick={() => setIsOpen(true)}
        className="absolute left-[392px] top-[181px] w-[240px] h-[82px] z-40 rounded-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/80"
      />
    );
  }

  return (
    <div
      data-testid="oracle-guide"
      role="dialog"
      aria-modal="true"
      aria-label="Sarvam AI Heritage Guide"
      className="absolute right-[20px] top-[87px] w-[320px] h-[424px] bg-[#0a0907]/95 backdrop-blur-md border border-primary/35 rounded-lg z-40 flex flex-col shadow-2xl overflow-hidden"
    >
      {/* Corner brackets */}
      <div className="absolute top-[3px] left-[3px] w-[10px] h-[10px] border-t-[1.5px] border-l-[1.5px] border-primary pointer-events-none" />
      <div className="absolute top-[3px] right-[3px] w-[10px] h-[10px] border-t-[1.5px] border-r-[1.5px] border-primary pointer-events-none" />
      <div className="absolute bottom-[3px] left-[3px] w-[10px] h-[10px] border-b-[1.5px] border-l-[1.5px] border-primary pointer-events-none" />
      <div className="absolute bottom-[3px] right-[3px] w-[10px] h-[10px] border-b-[1.5px] border-r-[1.5px] border-primary pointer-events-none" />

      {/* Header */}
      <div className="shrink-0 pt-[14px] pb-[10px] flex flex-col items-center border-b border-primary/20 relative bg-black/40">
        <Sparkles className="absolute top-[14px] left-[16px] w-[12px] h-[12px] text-primary/40" />
        <Sparkles className="absolute top-[14px] right-[16px] w-[12px] h-[12px] text-primary/40" />
        
        <span className="text-[7px] text-primary/90 uppercase tracking-[0.2em] font-medium block mb-[2px]">
          AI Guide
        </span>
        <h2 className="font-title-serif text-[15px] font-bold text-white uppercase tracking-widest text-glow leading-tight">
          The Oracle
        </h2>
        <button
          type="button"
          aria-label="AI Guide band karo"
          onClick={() => {
          closeGuide();
          }}
          className="absolute right-[10px] top-[10px] w-[24px] h-[24px] grid place-items-center rounded-full text-primary/65 hover:text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/80"
        >
          <X className="w-[12px] h-[12px]" aria-hidden />
        </button>
      </div>

      {/* Scrollable Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-[16px] flex flex-col relative"
      >
        {voiceTranscript && (
          <div className="mb-[14px] rounded-md border border-primary/25 bg-primary/5 p-[10px]">
            <label
              htmlFor="oracle-voice-transcript"
              className="text-[8px] uppercase tracking-widest text-primary/80 block mb-[6px]"
            >
              Transcript check karo
            </label>
            <textarea
              ref={transcriptRef}
              id="oracle-voice-transcript"
              data-testid="oracle-voice-transcript"
              value={voiceTranscript}
              onChange={event => setVoiceTranscript(event.target.value)}
              maxLength={300}
              rows={3}
              className="w-full resize-none bg-[#12100c] border border-primary/20 rounded text-[12px] leading-relaxed text-white p-[8px] focus:outline-none focus:border-primary/70"
            />
            <button
              type="button"
              data-testid="oracle-voice-submit"
              onClick={sendVoiceQuestion}
              disabled={askGuide.isPending || voiceTranscript.trim().length < 2}
              className="mt-[8px] w-full rounded border border-primary/40 bg-primary/10 py-[7px] text-[9px] uppercase tracking-widest text-primary hover:bg-primary/20 disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/80"
            >
              Sawal bhejo
            </button>
          </div>
        )}
        {guideState.type === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <div className="w-[36px] h-[36px] rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center mb-[12px] shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <Sparkles className="w-[16px] h-[16px] text-primary" />
            </div>
              <p className="font-serif text-[13px] text-white/90 mb-[6px] italic">
                “Bharat ke kis raaz ko khojna hai?”
            </p>
            <p className="text-[9px] text-muted-foreground mb-[20px] max-w-[220px] leading-relaxed">
              Sindhu Ghati, Mohenjo-Daro aur BharatVerse ki discoveries ke baare mein poochho.
            </p>
            
            <div className="w-full flex flex-col gap-[6px]">
              {DEFAULT_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(sug)}
                  className="text-left w-full p-[10px] rounded bg-black/40 border border-primary/15 hover:border-primary/40 hover:bg-primary/5 transition-colors group relative overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/80"
                >
                  <span className="text-[11px] text-white/80 group-hover:text-white transition-colors relative z-10 block pr-[20px]">
                    "{sug}"
                  </span>
                  <CornerDownRight className="absolute right-[10px] top-[50%] -translate-y-[50%] w-[12px] h-[12px] text-primary/40 group-hover:text-primary transition-colors z-10" />
                </button>
              ))}
            </div>
          </div>
        )}

        {guideState.type === 'loading' && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            <div className="mb-[24px]">
              <span className="text-[8px] uppercase tracking-widest text-primary/70 block mb-[4px]">You asked</span>
              <p className="text-[13px] text-white font-medium italic">"{guideState.question}"</p>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center gap-[16px]">
              <div className="relative w-[32px] h-[32px]">
                <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-primary rounded-full border-t-transparent animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-[12px] h-[12px] text-primary/60 animate-pulse" />
              </div>
              <p className="text-[9px] text-primary/70 uppercase tracking-widest animate-pulse">
                Smriti Didi khoj rahi hain...
              </p>
            </div>
          </div>
        )}

        {guideState.type === 'error' && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-300">
            <div className="mb-[24px]">
              <span className="text-[8px] uppercase tracking-widest text-primary/70 block mb-[4px]">You asked</span>
              <p className="text-[13px] text-white font-medium italic">"{guideState.question}"</p>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-[12px]">
              <AlertCircle className="w-[24px] h-[24px] text-destructive/80" />
              <p className="text-[11px] text-destructive/90 px-[10px]">{guideState.error}</p>
              <button 
                onClick={() => handleSubmit(guideState.question)}
                className="mt-[8px] px-[16px] py-[6px] rounded border border-primary/30 text-[9px] uppercase tracking-widest text-primary hover:bg-primary/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/80"
              >
                 Phir Poochho
              </button>
            </div>
          </div>
        )}

        {guideState.type === 'answered' && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-[20px]">
              <span className="text-[8px] uppercase tracking-widest text-primary/70 block mb-[4px]">You asked</span>
              <p className="text-[13px] text-white font-medium italic">"{guideState.question}"</p>
            </div>
            
            <div className="relative bg-primary/5 border border-primary/10 rounded-md p-[14px]">
              <div className="flex items-center justify-between mb-[12px]">
                <span className="text-[8px] uppercase tracking-widest text-primary/80 font-medium">
                  The Oracle Answers
                </span>
                
                <button
                  onClick={() => toggle([guideState.answer])}
                  className={`flex items-center gap-[4px] px-[8px] py-[4px] rounded transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/80 ${
                    speaking 
                      ? 'bg-primary/20 text-primary border border-primary/40' 
                      : 'bg-black/40 text-primary/70 border border-primary/20 hover:bg-primary/15 hover:text-primary hover:border-primary/40'
                  }`}
                  title={speaking ? "Stop listening" : "Listen to answer"}
                >
                  {speaking ? (
                    <>
                      <Square className="w-[8px] h-[8px] fill-current" />
                      <span className="text-[8px] font-bold tracking-wide">STOP</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-[10px] h-[10px]" />
                      <span className="text-[8px] font-bold tracking-wide">SUNO</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="text-[13px] leading-[1.7] text-white/95 space-y-[12px] font-serif">
                {guideState.answer.split('\n').filter(p => p.trim()).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
            
            {guideState.suggestions.length > 0 && (
              <div className="mt-[24px]">
                <span className="text-[8px] uppercase tracking-widest text-muted-foreground block mb-[10px] flex items-center gap-[6px]">
                  <span className="h-px bg-primary/15 flex-1" />
                  Aur Jaano
                  <span className="h-px bg-primary/15 flex-1" />
                </span>
                <div className="flex flex-col gap-[6px]">
                  {guideState.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmit(sug)}
                      className="text-left w-full p-[10px] rounded bg-black/40 border border-primary/15 hover:border-primary/40 hover:bg-primary/5 transition-colors group relative overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/80"
                    >
                      <span className="text-[11px] text-white/80 group-hover:text-white transition-colors relative z-10 block pr-[20px]">
                        "{sug}"
                      </span>
                      <CornerDownRight className="absolute right-[10px] top-[50%] -translate-y-[50%] w-[12px] h-[12px] text-primary/40 group-hover:text-primary transition-colors z-10" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Pad bottom for scroll breathing room */}
            <div className="h-[12px] shrink-0" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-[12px] border-t border-primary/20 bg-black/60 relative">
        <div className="mb-[8px] min-h-[18px]" aria-live="polite">
          {voiceState === 'requesting' && (
            <p data-testid="oracle-voice-status" className="text-[9px] text-primary/80 text-center">
              Microphone permission maang rahe hain...
            </p>
          )}
          {voiceState === 'listening' && (
            <p data-testid="oracle-voice-status" className="text-[9px] text-primary text-center animate-pulse">
              Sun rahi hoon... khatam karne ke liye mic dabao
            </p>
          )}
          {voiceState === 'processing' && (
            <p data-testid="oracle-voice-status" className="text-[9px] text-primary/80 text-center flex items-center justify-center gap-[5px]">
              <LoaderCircle className="w-[11px] h-[11px] animate-spin" aria-hidden />
              Transcript ban raha hai...
            </p>
          )}
          {voiceState === 'error' && (
            <div className="flex items-center justify-center gap-[6px]">
              <p data-testid="oracle-voice-status" className="text-[9px] text-destructive/90 text-center">
                {voiceError}
              </p>
              <RotateCcw className="w-[10px] h-[10px] text-primary/70" aria-hidden />
            </div>
          )}
        </div>
        <form 
          onSubmit={handleFormSubmit}
          className="relative flex items-center"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Apna sawal poochho..."
            maxLength={300}
            disabled={askGuide.isPending || voiceState === 'processing'}
            className="w-full bg-[#12100c] border border-primary/30 rounded-full text-[12px] text-white pl-[16px] pr-[72px] py-[10px] focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60 disabled:opacity-50"
          />
          <button
            type="button"
            data-testid="oracle-voice-button"
            aria-label={
              voiceState === 'listening'
                ? 'Sawal bolna band karo'
                : voiceState === 'error'
                  ? 'Microphone se phir se bolo'
                  : 'Microphone se sawal bolo'
            }
            title={
              voiceState === 'listening'
                ? 'Recording band karo'
                : voiceState === 'error'
                  ? 'Phir se bolo'
                  : 'Sawal bolkar poochho'
            }
            onClick={voiceState === 'listening' ? stopVoiceQuestion : startVoiceQuestion}
            disabled={askGuide.isPending || voiceState === 'requesting' || voiceState === 'processing'}
            className={`absolute right-[36px] top-[50%] -translate-y-[50%] w-[28px] h-[28px] flex items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              voiceState === 'listening'
                ? 'bg-destructive/20 text-destructive border border-destructive/50 animate-pulse'
                : 'text-primary/80 hover:bg-primary/15 hover:text-primary'
            } disabled:opacity-40`}
          >
            {voiceState === 'processing' || voiceState === 'requesting' ? (
              <LoaderCircle className="w-[14px] h-[14px] animate-spin" aria-hidden />
            ) : voiceState === 'listening' ? (
              <Square className="w-[10px] h-[10px] fill-current" aria-hidden />
            ) : (
              <Mic className="w-[15px] h-[15px]" aria-hidden />
            )}
          </button>
          <button
            type="submit"
            disabled={askGuide.isPending || inputValue.trim().length < 2}
            className="absolute right-[4px] top-[50%] -translate-y-[50%] w-[28px] h-[28px] flex items-center justify-center rounded-full text-primary hover:bg-primary/15 disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Smriti Didi se sawal poochho"
            title="Smriti Didi se poochho"
          >
            <ArrowUpRight className="w-[16px] h-[16px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
