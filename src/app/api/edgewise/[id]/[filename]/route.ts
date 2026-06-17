import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { fetchEdgewiseImage } from "@/lib/edgewise";

type Params = { params: Promise<{ id: string; filename: string }> };

function findEdgewiseCreds(
  cfg: Awaited<ReturnType<typeof loadConfig>>,
): { baseUrl: string; token: string } | null {
  const all = [...cfg.center, ...cfg.columns.flatMap((c) => c.widgets)];
  const w = all.find((x) => x.type === "edgewise");
  if (!w || w.type !== "edgewise") return null;
  return { baseUrl: w.baseUrl, token: w.token };
}

export async function GET(_req: Request, { params }: Params) {
  const { id, filename } = await params;
  if (!id || !filename) {
    return new NextResponse("missing id or filename", { status: 400 });
  }

  const cfg = await loadConfig();
  const creds = findEdgewiseCreds(cfg);
  if (!creds) {
    return new NextResponse("no edgewise widget configured", { status: 404 });
  }

  const upstream = await fetchEdgewiseImage({
    baseUrl: creds.baseUrl,
    token: creds.token,
    knifeId: id,
    filename,
  });

  if (!upstream.ok || !upstream.body) {
    return new NextResponse(`upstream ${upstream.status}`, {
      status: upstream.status,
    });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": "public, max-age=86400, immutable",
    },
  });
}
