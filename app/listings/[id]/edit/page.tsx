"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { LocationInput, LocationResult } from "@/components/ui/LocationInput";
import { PLATFORM_CONFIG } from "@/components/ui/Badges";
import { PLATFORMS } from "@/lib/utils";
import { Upload, X, DollarSign, Trash2, Gamepad2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const EDITIONS = [
  "Standard", "Deluxe", "Gold", "Ultimate", "Game of the Year (GOTY)",
  "Anniversary", "Limited", "Collector's", "Digital", "Other",
];

export default function EditListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // ALL hooks declared before any conditional returns — React rules of hooks
  const [fetching,          setFetching]          = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [deleting,          setDeleting]          = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [locationValid,     setLocationValid]     = useState(true);
  const [uploadingImages,   setUploadingImages]   = useState(false);
  const [images,            setImages]            = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", price: "", platform: "",
    edition: "", condition: "", location: "", latitude: "",
    longitude: "", listingStatus: "active",
  });

  useEffect(() => {
    if (!id) return;
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { toast.error("Listing not found"); router.push("/"); return; }
        setForm({
          title:         data.title        ?? "",
          description:   data.description  ?? "",
          price:         String(data.price ?? ""),
          platform:      data.platform     ?? "",
          edition:       data.edition      ?? "",
          condition:     data.condition    ?? "",
          location:      data.location     ?? "",
          latitude:      data.latitude  ? String(data.latitude)  : "",
          longitude:     data.longitude ? String(data.longitude) : "",
          listingStatus: data.status ?? "active",
        });
        try { setImages(JSON.parse(data.images ?? "[]")); } catch { setImages([]); }
      })
      .catch(() => toast.error("Failed to load listing"))
      .finally(() => setFetching(false));
  }, [id, router]);

  // Conditional renders come AFTER all hooks
  if (status === "loading" || fetching) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  const handleLocationChange = (display: string, result?: LocationResult) => {
    setLocationValid(!!result);
    setForm((f) => ({
      ...f,
      location:  display,
      latitude:  result ? String(result.lat) : f.latitude,
      longitude: result ? String(result.lng) : f.longitude,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 6) { toast.error("Maximum 6 images"); return; }

    setUploadingImages(true);
    const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    try {
      for (const file of files) {
        if (cloudName && uploadPreset) {
          // Upload directly from browser to Cloudinary — no server round-trip, full quality
          const fd = new FormData();
          fd.append("file", file);
          fd.append("upload_preset", uploadPreset);
          fd.append("folder", "replayr/listings");
          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: fd }
          );
          if (res.ok) {
            const result = await res.json();
            const url = result.secure_url.replace("/upload/", "/upload/q_auto:best,f_auto/");
            setImages((prev) => [...prev, url]);
          } else {
            toast.error("Image upload failed");
          }
        } else {
          // Fallback to base64 if Cloudinary not configured
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.readAsDataURL(file);
          });
          setImages((prev) => [...prev, base64]);
          toast.error("Cloudinary not configured — image stored locally (lower quality)");
        }
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.platform)  { toast.error("Please select a platform"); return; }
    if (!form.condition) { toast.error("Please select a condition"); return; }
    if (!form.location || !locationValid) {
      toast.error("Please select a valid location from the suggestions");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), images, status: form.listingStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Listing updated!");
      router.push(`/listings/${id}`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Listing deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete listing");
      setDeleting(false);
    }
  };

  const selectedPlatformConfig = form.platform ? PLATFORM_CONFIG[form.platform] : null;
  const PlatformLogo = selectedPlatformConfig?.Logo;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white mb-1">Edit Listing</h1>
            <p className="text-gray-400 text-sm">Make changes and save to update your listing</p>
          </div>
          <button
            type="button" onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Photos */}
          <div className="card p-6">
            <h3 className="font-semibold text-white mb-4">
              Photos <span className="text-gray-500 font-normal text-sm ml-2">({images.length}/6)</span>
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-dark-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                    <X className="w-3 h-3 text-white" />
                  </button>
                  {i === 0 && (
                    <div className="absolute bottom-2 left-2 bg-brand-500/90 rounded-md px-2 py-0.5 text-xs font-semibold text-white">Cover</div>
                  )}
                </div>
              ))}
              {uploadingImages && (
                <div className="aspect-square rounded-xl border-2 border-dashed border-brand-500/50 bg-dark-700 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-brand-400">Uploading…</span>
                </div>
              )}
              {images.length < 6 && !uploadingImages && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-dark-500 hover:border-brand-500 flex flex-col items-center justify-center cursor-pointer transition-colors bg-dark-700/50">
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-400">Add Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Game Details */}
          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-white text-lg">Game Details</h3>
            <div>
              <label className="label-base">Game Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Spider-Man 2" required className="input-base" />
            </div>
            <div>
              <label className="label-base">Platform *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {PLATFORMS.map((p) => {
                  const config = PLATFORM_CONFIG[p] ?? PLATFORM_CONFIG["Other"];
                  const Logo = config.Logo;
                  const selected = form.platform === p;
                  return (
                    <button key={p} type="button" onClick={() => setForm({ ...form, platform: p })}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        selected ? `${config.colorClass} border-current` : "bg-dark-700 border-dark-500 text-gray-400 hover:border-dark-400"
                      }`}>
                      <Logo className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="label-base">Edition</label>
              <select value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} className="input-base">
                <option value="">Select edition (optional)</option>
                {EDITIONS.map((ed) => <option key={ed} value={ed}>{ed}</option>)}
              </select>
            </div>
            <div>
              <label className="label-base">Condition *</label>
              <div className="space-y-2 mt-1">
                {([
                  ["Brand New",  "Sealed, never opened"],
                  ["Like New",   "Opened but barely played, no marks"],
                  ["Very Good",  "Minor cosmetic wear, plays perfectly"],
                  ["Good",       "Normal use wear, fully functional"],
                  ["Acceptable", "Heavy wear but disc still plays fine"],
                ] as const).map(([cond, desc]) => (
                  <button key={cond} type="button" onClick={() => setForm({ ...form, condition: cond })}
                    className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border transition-all ${
                      form.condition === cond ? "border-brand-500 bg-brand-500/10" : "border-dark-500 bg-dark-700 hover:border-dark-400"
                    }`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      form.condition === cond ? "border-brand-500 bg-brand-500" : "border-gray-600"
                    }`} />
                    <div>
                      <div className={`text-sm font-semibold ${form.condition === cond ? "text-brand-400" : "text-white"}`}>{cond}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-base">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the game, any scratches, included DLC, reason for selling…" rows={4} className="input-base resize-none" />
            </div>
          </div>

          {/* Price & Location */}
          <div className="card p-6 space-y-5">
            <h3 className="font-semibold text-white text-lg">Price & Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base">Asking Price (CAD) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00" min="0" step="0.01" required className="input-base pl-11" />
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label-base">Your General Location *</label>
                <LocationInput value={form.location} onChange={handleLocationChange} isValid={locationValid} required />
                {form.latitude && (
                  <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1.5">
                    <span>🔒</span><span>Pinned — buyers see only a <strong>fuzzy area</strong>, never your exact address</span>
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="label-base">Listing Status</label>
              <div className="flex gap-2 mt-1">
                {(["active", "sold", "inactive"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setForm({ ...form, listingStatus: s })}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                      form.listingStatus === s
                        ? s === "active" ? "bg-green-500/20 border-green-500 text-green-400"
                        : s === "sold"   ? "bg-blue-500/20 border-blue-500 text-blue-400"
                        :                 "bg-gray-500/20 border-gray-500 text-gray-400"
                        : "bg-dark-700 border-dark-500 text-gray-500 hover:border-dark-400"
                    }`}>
                    {s === "active" ? "✓ Active" : s === "sold" ? "💰 Sold" : "○ Inactive"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pb-10">
            <Link href={`/listings/${id}`} className="btn-secondary flex-1 text-center">Cancel</Link>
            <button type="submit" disabled={saving || !locationValid || uploadingImages}
              className="btn-primary flex-[2] flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Save Changes"}
            </button>
          </div>
        </form>
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-display font-bold text-white text-xl text-center mb-2">Delete listing?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              This will permanently remove <span className="text-white font-medium">{form.title}</span> and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
