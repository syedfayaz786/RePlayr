import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data, filename, folder: folderParam } = await req.json();
    if (!data) return NextResponse.json({ error: "No image data" }, { status: 400 });

    const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
    }

    const formData = new FormData();
    formData.append("file", data);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folderParam ?? "replayr/listings");

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
    // fl_progressive,q_auto,f_auto = progressive JPEG, auto quality, auto format (webp if supported)
    const url = result.secure_url.replace("/upload/", "/upload/fl_progressive,q_auto,f_auto/");
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
