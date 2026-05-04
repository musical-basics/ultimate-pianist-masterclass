import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const CONTENT_ROOT = path.join(process.cwd(), "content", "courses");

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

const isAdminGated =
  process.env.NODE_ENV === "production" && process.env.ENABLE_ADMIN !== "true";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (isAdminGated) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { path: parts } = await params;
  if (!parts || parts.length < 4) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  const [course, section, lesson, ...rest] = parts;
  const subpath = rest.map(decodeURIComponent).join("/");
  const assetsRoot = path.join(CONTENT_ROOT, course, section, lesson, "assets");
  const filePath = path.normalize(path.join(assetsRoot, subpath));

  if (!filePath.startsWith(assetsRoot + path.sep) && filePath !== assetsRoot) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(subpath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
