// app/api/h2h/route.ts
import { NextResponse } from "next/server";
import { getH2H } from "@/lib/tennisexplorer/h2h";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/h2h?slugA=...&slugB=...&format=csv|json
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const a = (searchParams.get("slugA") || "").trim();
  const b = (searchParams.get("slugB") || "").trim();
  const format = (searchParams.get("format") || "json").toLowerCase();
  if (!a || !b) return NextResponse.json({ error: "Missing slugA/slugB" }, { status: 400 });

  const data = await getH2H(a, b) || { winsA: 0, winsB: 0, meetings: [] };

  if (format === "csv") {
    const header = ["date","tournament","winner","score"];
    const rows = (data.meetings || []).map(m => [
      m.date || "",
      m.tournament || "",
      m.winner || "",
      m.score || ""
    ]);
    const esc = (v: any) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header.join(","), ...rows.map(r => r.map(esc).join(","))].join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=h2h_${a}_${b}.csv`
      }
    });
  }

  return NextResponse.json({ h2h: data }, { status: 200 });
}
