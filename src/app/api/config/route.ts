import { promises as fs } from "node:fs";
import { NextResponse } from "next/server";
import { configEditEnabled, configPath, validateConfigText } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!configEditEnabled()) {
    return NextResponse.json({ error: "Config editing is disabled." }, { status: 403 });
  }
  try {
    const text = await fs.readFile(configPath(), "utf8");
    return NextResponse.json({ yaml: text });
  } catch (e: unknown) {
    // Missing file is fine — start from a blank editor.
    if (typeof e === "object" && e && "code" in e && (e as { code?: string }).code === "ENOENT") {
      return NextResponse.json({ yaml: "" });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to read config." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  if (!configEditEnabled()) {
    return NextResponse.json({ error: "Config editing is disabled." }, { status: 403 });
  }

  let body: { yaml?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof body.yaml !== "string") {
    return NextResponse.json({ error: "Expected a `yaml` string." }, { status: 400 });
  }

  const check = validateConfigText(body.yaml);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const file = configPath();
  try {
    // Cheap insurance: keep the previous version next to the file.
    try {
      const prev = await fs.readFile(file, "utf8");
      await fs.writeFile(`${file}.bak`, prev, "utf8");
    } catch {
      // No existing file to back up — first write.
    }
    await fs.writeFile(file, body.yaml, "utf8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to write config." },
      { status: 500 },
    );
  }
}
