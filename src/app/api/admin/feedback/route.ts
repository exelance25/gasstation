import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/server/admin/require-admin";
import { deleteFeedbackMessage, listFeedbackMessages } from "@/server/feedback/feedback-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, error } = await requireAdminSession();
  if (!session) return error!;

  const messages = await listFeedbackMessages();
  return NextResponse.json({ messages });
}

export async function DELETE(request: NextRequest) {
  const { session, error } = await requireAdminSession();
  if (!session) return error!;

  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Mesaj id gerekli" }, { status: 400 });
  }

  const ok = await deleteFeedbackMessage(id);
  if (!ok) {
    return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
