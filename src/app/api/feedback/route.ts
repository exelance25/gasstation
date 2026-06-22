import { NextRequest, NextResponse } from "next/server";
import { createFeedbackMessage } from "@/server/feedback/feedback-store";
import { checkRateLimit, getClientIp } from "@/server/security/rate-limit-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit("feedback", ip, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests — please wait a moment." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (email.length > 254) {
    return NextResponse.json({ error: "Email is too long." }, { status: 400 });
  }
  if (message.length > 4_000) {
    return NextResponse.json({ error: "Message must be at most 4000 characters." }, { status: 400 });
  }

  createFeedbackMessage({ email, message: message || "—" });
  return NextResponse.json({ ok: true });
}
