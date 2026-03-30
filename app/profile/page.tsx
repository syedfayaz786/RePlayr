"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { User, MapPin, Save, Star, Camera, Loader2, X, Check, ZoomIn, ZoomOut } from "lucide-react";
import toast from "react-hot-toast";
import { ErrorBanner } from "@/components/ui/InlineError";
import { StarRating } from "@/components/ui/StarRating";
import { ReviewsTabs } from "@/components/ui/ReviewsTabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { AvatarPickerModal } from "@/components/ui/AvatarPickerModal";
import Image from "next/image";

// ── Avatar Crop Modal ──────────────────────────────────────────────────────────
function AvatarCropModal({
  src,
  onConfirm,
  onCancel,
}: {
  src: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 1, h: 1 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const PREVIEW_SIZE = 280; // px — the circular viewport

  // Load image, compute initial scale to fill the circle
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      const shorter = Math.min(img.naturalWidth, img.naturalHeight);
      const initialScale = PREVIEW_SIZE / shorter;
      setScale(initialScale);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
    img.src = src;
  }, [src]);

  // Draw onto the preview canvas
  useEffect(() => {
    if (!imgLoaded || !imgRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = PREVIEW_SIZE;
    canvas.height = PREVIEW_SIZE;

    const img = imgRef.current;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const x = PREVIEW_SIZE / 2 - drawW / 2 + offset.x;
    const y = PREVIEW_SIZE / 2 - drawH / 2 + offset.y;

    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    ctx.drawImage(img, x, y, drawW, drawH);
  }, [imgLoaded, offset, scale]);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onMouseUp = () => setDragging(false);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(10, Math.max(0.1, s - e.deltaY * 0.001)));
  };

  const handleConfirm = () => {
    if (!canvasRef.current) return;
    // Render final 400×400 crop
    const out = document.createElement("canvas");
    out.width = 400;
    out.height = 400;
    const ctx = out.getContext("2d")!;
    const img = imgRef.current!;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const x = PREVIEW_SIZE / 2 - drawW / 2 + offset.x;
    const y = PREVIEW_SIZE / 2 - drawH / 2 + offset.y;
    const factor = 400 / PREVIEW_SIZE;
    ctx.drawImage(img, x * factor, y * factor, drawW * factor, drawH * factor);
    onConfirm(out.toDataURL("image/jpeg", 0.92));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 flex flex-col items-center gap-5 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-white font-semibold text-base">Adjust Photo</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400 -mt-2">Drag to reposition · Scroll to zoom</p>

        {/* Circular crop viewport */}
        <div
          ref={containerRef}
          className="relative select-none rounded-full ring-2 ring-brand-500/60 overflow-hidden"
          style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, cursor: dragging ? "grabbing" : "grab" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => setDragging(false)}
          onWheel={onWheel}
        >
          <canvas
            ref={canvasRef}
            width={PREVIEW_SIZE}
            height={PREVIEW_SIZE}
            style={{ display: "block" }}
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => setScale((s) => Math.max(0.1, s - 0.1))}
            className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 accent-brand-500"
          />
          <button
            onClick={() => setScale((s) => Math.min(5, s + 0.1))}
            className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-dark-500 text-gray-300 hover:text-white hover:border-dark-400 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-600 text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile Page ───────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          setName(data.name ?? "");
          setBio(data.bio ?? "");
          setLocation(data.location ?? "");
          setImage(data.image ?? null);
          setReviews(data.reviewsReceived ?? []);
        });
    }
  }, [session]);

  // Step 1: file picked → open crop modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    // reset so same file can be re-picked
    e.target.value = "";
  };

  // Step 2: crop confirmed → upload cropped canvas data URL
  const handleCropConfirm = async (croppedDataUrl: string) => {
    setCropSrc(null);
    setUploadingAvatar(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: croppedDataUrl, filename: "avatar.jpg", folder: "replayr/avatars" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Upload failed");
      }
      const { url } = await res.json();
      setImage(url);
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      setPhotoError(err?.message ?? "Failed to upload photo. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, location, image }),
      });
      if (res.ok) {
        await update({ name, image });
        toast.success("Profile saved!");
      } else {
        const d = await res.json().catch(() => ({}));
        setSaveError(d?.error ?? "Failed to save profile. Please try again.");
      }
    } catch {
      setSaveError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  const avgRating = reviews.length
    ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
    : 0;

  const displayImage = image ?? session.user?.image;

  return (
    <div className="min-h-screen flex flex-col">
      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
      {showAvatarPicker && (
        <AvatarPickerModal
          currentImage={image}
          onSelect={(url) => setImage(url)}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
      <Navbar />
      <PageHeader crumbs={[{ label: "My Profile" }]} />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-8 w-full py-8">
        <div className="flex flex-col gap-6">
          {/* Profile card */}
          <div className="space-y-4">
            <div className="card p-6">
              <div className="flex flex-col items-center text-center mb-6">
                {/* Avatar with upload button */}
                <div className="relative mb-3">
                  {displayImage ? (
                    displayImage.startsWith("data:") ? (
                      <img src={displayImage} alt={name ?? ""} className="rounded-full object-cover w-20 h-20" />
                    ) : (
                      <Image
                        src={displayImage}
                        alt={name ?? ""}
                        width={80}
                        height={80}
                        className="rounded-full object-cover w-20 h-20"
                      />
                    )
                  ) : (
                    <div className="w-20 h-20 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-3xl">
                      {name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-500 hover:bg-brand-400 rounded-full flex items-center justify-center transition-colors shadow-lg"
                    title="Upload photo"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.avif"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors mt-1"
                >
                  Choose avatar
                </button>

                <h2 className="font-semibold text-white text-lg">{session.user?.name}</h2>
                <p className="text-gray-400 text-sm">{session.user?.email}</p>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={Math.round(avgRating)} size="sm" />
                    <span className="text-xs text-gray-400">
                      {avgRating.toFixed(1)} ({reviews.length})
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label-base">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-base pl-11"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-base">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Toronto, ON"
                      className="input-base pl-11"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-base">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell other gamers about yourself..."
                    rows={3}
                    className="input-base resize-none"
                  />
                </div>
                {(photoError || saveError) && (
                  <ErrorBanner
                    message={photoError || saveError}
                    onDismiss={() => { setPhotoError(""); setSaveError(""); }}
                  />
                )}
                <button
                  onClick={saveProfile}
                  disabled={saving || uploadingAvatar}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Reviews ({reviews.length})
            </h2>
            {reviews.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Star className="w-10 h-10 mx-auto mb-3 text-gray-500" />
                <p>No reviews yet — complete a trade to receive your first review!</p>
              </div>
            ) : (
              <ReviewsTabs reviews={reviews.map((r: any) => ({
                ...r,
                createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date(r.createdAt).toISOString(),
              }))} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
