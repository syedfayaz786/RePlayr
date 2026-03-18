import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Allowed formats per context
const ALLOWED_FORMATS: Record<string, string[]> = {
  "replayr/avatars":   ["image/jpeg", "image/png", "image/webp", "image/avif"],
  "replayr/messages":  ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"],
  "replayr/listings":  ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
};

// Max sizes in bytes
const MAX_SIZE: Record<string, number> = {
  "replayr/avatars":  5  * 1024 * 1024,  // 5 MB
  "replayr/messages": 20 * 1024 * 1024,  // 20 MB
  "replayr/listings": 10 * 1024 * 1024,  // 10 MB
};

function base64SizeBytes(base64: string): number {
  const base64Data = base64.split(",")[1] ?? base64;
  return Math.floor((base64Data.length * 3) / 4);
}

function getMimeType(base64: string): string {
  const match = base64.match(/^data:([^;]+);/);
  return match?.[1] ?? "";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data, filename, folder: folderParam } = await req.json();
    if (!data) return NextResponse.json({ error: "No image data" }, { status: 400 });

    const folder = folderParam ?? "replayr/listings";
    const mimeType = getMimeType(data);
    const sizeBytes = base64SizeBytes(data);

    // Format validation
    const allowed = ALLOWED_FORMATS[folder] ?? ALLOWED_FORMATS["replayr/listings"];
    if (mimeType && !allowed.includes(mimeType)) {
      const ext = mimeType.split("/")[1]?.toUpperCase() ?? "file";
      return NextResponse.json(
        { error: `${ext} files are not allowed here. Accepted: ${allowed.map(f => "." + f.split("/")[1]).join(", ")}` },
        { status: 400 }
      );
    }

    // Size validation
    const maxBytes = MAX_SIZE[folder] ?? MAX_SIZE["replayr/listings"];
    if (sizeBytes > maxBytes) {
      const maxMB = maxBytes / (1024 * 1024);
      const actualMB = (sizeBytes / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `File too large (${actualMB} MB). Maximum allowed is ${maxMB} MB.` },
        { status: 400 }
      );
    }

    const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
    }

    const formData = new FormData();
    formData.append("file", data);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Cloudinary error:", err);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const result = await res.json();
    const url = result.secure_url.replace("/upload/", "/upload/fl_progressive,q_auto,f_auto/");
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
