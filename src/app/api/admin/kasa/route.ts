import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/admin/require-admin";
import { getKasaOverview } from "@/server/admin/kasa-overview";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, error } = await requireAdminSession();
  if (!session) return error!;

  try {
    const overview = await getKasaOverview();
    return NextResponse.json(overview);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Kasa özeti alınamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
