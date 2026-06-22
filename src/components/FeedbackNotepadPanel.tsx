"use client";

import { useCallback, useEffect, useState } from "react";
import { messages } from "@/i18n/messages";
import { useToast } from "@/providers/ToastProvider";

type FeedbackNotepadPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function FeedbackNotepadPanel({ open, onClose }: FeedbackNotepadPanelProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body.error === "string" ? body.error : messages.feedback.sendFailed);
      }
      showToast({
        variant: "success",
        title: messages.feedback.thanksTitle,
        message: messages.feedback.thanksMessage,
        persist: true,
      });
      setEmail("");
      setMessage("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : messages.feedback.sendFailed);
    } finally {
      setSending(false);
    }
  }, [email, message, onClose, showToast]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-start justify-center overflow-y-auto bg-black/55 px-3 pb-8 pt-[max(3.5rem,8vh)] backdrop-blur-[3px] sm:items-center sm:px-4 sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-notepad-title"
      onClick={onClose}
    >
      <div
        className="feedback-notepad-hanging relative w-full max-w-[min(94vw,520px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -top-[52px] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center" aria-hidden>
          <div className="h-10 w-px bg-gradient-to-b from-transparent via-neutral-400/50 to-neutral-500/70" />
          <div className="relative -mt-0.5 h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-red-800 shadow-[0_2px_6px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]">
            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-950/40" />
          </div>
        </div>

        <div
          className="pointer-events-none absolute -bottom-5 left-[8%] right-[8%] h-8 rounded-[50%] bg-black/35 blur-xl"
          aria-hidden
        />

        <div className="feedback-notepad-sheet relative overflow-hidden px-7 pb-8 pt-7 sm:px-9 sm:pb-10 sm:pt-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full px-2 py-0.5 text-xl leading-none text-[#8a7350]/75 transition hover:bg-[#c4a574]/20 hover:text-[#5c4a32]"
            aria-label={messages.feedback.close}
          >
            ×
          </button>

          <p
            id="feedback-notepad-title"
            className="mb-4 pr-8 font-serif text-lg font-bold tracking-wide text-[#5c4a32] sm:text-xl"
          >
            {messages.feedback.title}
          </p>
          <p className="mb-5 text-[12px] leading-relaxed text-[#7a6648] sm:text-[13px]">
            {messages.feedback.subtitle}
          </p>

          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#8a7350]">
            {messages.feedback.email} <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={messages.feedback.emailPlaceholder}
            className="mb-4 w-full border-b-2 border-[#c4a574]/50 bg-transparent px-0 py-2 text-base text-[#3d3225] placeholder:text-[#a8926a]/70 focus:border-[#8a7350] focus:outline-none"
            autoComplete="email"
          />

          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#8a7350]">
            {messages.feedback.message}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={messages.feedback.messagePlaceholder}
            rows={9}
            className="min-h-[180px] w-full resize-none border-0 bg-transparent text-[15px] leading-[1.65] text-[#3d3225] placeholder:text-[#a8926a]/70 focus:outline-none focus:ring-0 sm:min-h-[220px] sm:text-base"
          />

          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

          <div className="mt-5 flex justify-end border-t border-[#c4a574]/25 pt-4">
            <button
              type="button"
              disabled={sending || !email.trim()}
              onClick={() => void handleSubmit()}
              className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#2563eb] transition hover:bg-[#2563eb]/10 disabled:opacity-40"
              aria-label={messages.feedback.send}
            >
              <span>{messages.feedback.send}</span>
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-[#2563eb] transition group-hover:translate-x-0.5"
                aria-hidden
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
