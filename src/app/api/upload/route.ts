import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { FILE_CATEGORIES } from "@/lib/constants";
import { isPublicDemo, PUBLIC_DEMO_MESSAGE } from "@/lib/public-demo";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "application/pdf": ".pdf",
};
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (isPublicDemo()) {
    return NextResponse.json({ error: PUBLIC_DEMO_MESSAGE }, { status: 403 });
  }

  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const clientId = formData.get("clientId") as string;
    const category = formData.get("category") as string;
    const angle = formData.get("angle") as string | null;
    const description = formData.get("description") as string | null;
    const designProjectId = formData.get("designProjectId") as string | null;

    if (!file || !clientId || !category) {
      return NextResponse.json(
        { error: "Missing required fields: file, clientId, category" },
        { status: 400 }
      );
    }

    if (!ID_PATTERN.test(clientId) || (designProjectId && !ID_PATTERN.test(designProjectId))) {
      return NextResponse.json({ error: "Invalid record identifier" }, { status: 400 });
    }

    if (!FILE_CATEGORIES.includes(category as (typeof FILE_CATEGORIES)[number])) {
      return NextResponse.json({ error: "Unsupported file category" }, { status: 400 });
    }

    if (!MIME_EXTENSIONS[file.type] || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Upload must be a JPG, PNG, WebP, AVIF, or PDF up to 10 MB." },
        { status: 400 }
      );
    }

    const ext = MIME_EXTENSIONS[file.type];
    const uniqueName = `${uuidv4()}${ext}`;
    let storagePath: string;

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (blobToken) {
      // Production: upload to Vercel Blob
      const blobPath = `uploads/${clientId}/${uniqueName}`;
      const blob = await put(blobPath, file, {
        access: "public",
        contentType: file.type,
        token: blobToken,
      });
      storagePath = blob.url;
    } else {
      // Local dev: write to public/uploads/
      const uploadDir = path.join(process.cwd(), "public", "uploads", clientId);
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, uniqueName);
      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));
      storagePath = `/uploads/${clientId}/${uniqueName}`;
    }

    const clientFile = await prisma.clientFile.create({
      data: {
        clientId,
        designProjectId: designProjectId || null,
        filename: file.name,
        storagePath,
        fileType: file.type,
        fileSize: file.size,
        category,
        angle: angle || null,
        description: description || null,
      },
    });

    return NextResponse.json(clientFile, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
