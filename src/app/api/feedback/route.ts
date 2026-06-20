import { NextRequest, NextResponse } from "next/server";
import { createFeedbackMessage } from "@/server/feedback/feedback-store";
import { checkRateLimit, getClientIp } from "@/server/security/rate-limit-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit("feedback", ip, 5, 60_000)) {
    return NextResponse.json({ error: "Çok fazla istek — lütfen biraz bekleyin." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }
  if (email.length > 254) {
    return NextResponse.json({ error: "E-posta çok uzun." }, { status: 400 });
  }
  if (message.length > 4_000) {
    return NextResponse.json({ error: "Mesaj en fazla 4000 karakter olabilir." }, { status: 400 });
  }

  createFeedbackMessage({ email, message: message || "—" });
  return NextResponse.json({ ok: true });
}
