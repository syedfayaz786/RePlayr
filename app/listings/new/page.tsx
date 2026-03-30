"use client";

import { PhotoEditor } from "@/components/ui/PhotoEditor";

import { Navbar } from "@/components/layout/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload, X, DollarSign, Gamepad2 } from "lucide-react";
import { PLATFORMS } from "@/lib/utils";
import { PLATFORM_CONFIG } from "@/components/ui/Badges";
import { LocationInput, LocationResult } from "@/components/ui/LocationInput";
import toast from "react-hot-toast";
import { ErrorBanner, FieldError } from "@/components/ui/InlineError";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import dynamic from "next/dynamic";
const LocationMapPreview = dynamic(() => import("@/components/ui/LocationMap"), {
  ssr: false,
  loading: () => <div className="h-40 rounded-xl bg-dark-700 animate-pulse" />,
});

const EDITIONS = [
  "Standard","Deluxe","Gold","Ultimate",
  "Game of the Year (GOTY)","Anniversary",
  "Limited","Collector's","Digital","Other",
];

const CONDITIONS: [string, string][] = [
  ["Brand New",  "Sealed, never opened"],
  ["Like New",   "Opened but barely played, no marks"],
  ["Very Good",  "Minor cosmetic wear, plays perfectly"],
  ["Good",       "Normal use wear, fully functional"],
  ["Acceptable", "Heavy wear but disc still plays fine"],
];

export default function NewListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "", description: "", price: "",
    platform: "", edition: "", condition: "",
    location: "", latitude: "", longitude: "", fuzzyLat: "", fuzzyLng: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1|2|3>(1);

  if (status === "loading") return null;
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col"><Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Gamepad2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Sign in required</h2>
            <p className="text-gray-400 mb-6">You need to be signed in to post a listing</p>
            <Link href="/auth/login" className="btn-primary">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  const [uploadingImages, setUploadingImages] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null); // raw file data URI pending edit

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 6) { setUploadError("Maximum 6 images allowed"); return; }
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = (ev) => setEditingPhoto(ev.target?.result as string);
      reader.readAsDataURL(files[0]);
      e.target.value = "";
      return;
    }

    setUploadingImages(true);
    const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    try {
      for (const file of files) {
        if (cloudName && uploadPreset) {
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
            setImages((p) => [...p, url]);
          } else {
            setUploadError("Image upload failed. Please try again.");
          }
        } else {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.readAsDataURL(file);
          });
          setImages((p) => [...p, base64]);
        }
      }
    } catch {
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  };

  // true only when user picked a result from the dropdown (has real coords)
  const [locationValid, setLocationValid] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const handleLocationChange = (display: string, result?: LocationResult) => {
    // Apply same fuzzy offset as server does (±500m), purely for preview
    const jitter = () => (Math.random() - 0.5) * 2 * 0.0045;
    setLocationValid(!!result); // only valid when a dropdown result was selected
    setForm((f) => ({
      ...f,
      location:  display,
      latitude:  result ? String(result.lat) : "",
      longitude: result ? String(result.lng) : "",
      fuzzyLat:  result ? String(result.lat + jitter()) : "",
      fuzzyLng:  result ? String(result.lng + jitter()) : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.platform)  { setFormError("Please select a platform"); return; }
    if (!form.condition) { setFormError("Please select a condition"); return; }
    if (!form.location || !locationValid) { setFormError("Please select a valid location from the suggestions"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Listing posted!");
      router.push(`/listings/${data.id}`);
    } catch (err: any) {
      setFormError(err.message ?? "Failed to post listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const platformConfig = form.platform ? PLATFORM_CONFIG[form.platform] : null;
  const PlatformLogo   = platformConfig?.Logo;
  const steps = ["Game Info", "Condition & Photos", "Price & Location"];

  const uploadEditedPhoto = async (dataUrl: string) => {
    setEditingPhoto(null);
    setUploadingImages(true);
    try {
      const cloudName   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      if (cloudName && uploadPreset) {
        const blob = await fetch(dataUrl).then((r) => r.blob());
        const fd   = new FormData();
        fd.append("file", blob, "photo.jpg");
        fd.append("upload_preset", uploadPreset);
        const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
        if (res.ok) {
          const result = await res.json();
          const url    = result.secure_url.replace("/upload/", "/upload/q_auto:best,f_auto/");
          setImages((prev) => [...prev, url]);
        } else {
          setUploadError("Image upload failed. Please try again.");
        }
      } else {
        setImages((prev) => [...prev, dataUrl]);
      }
    } catch {
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col"><Navbar />
      <PageHeader crumbs={[{ label: "Sell a Game" }]} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">Sell a Game</h1>
          <p className="text-gray-400">List your game disc and find a local buyer in minutes</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 sm:gap-2 mb-6 sm:mb-8 bg-dark-800 rounded-2xl p-3 sm:p-4 border border-dark-600 overflow-x-auto">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <button type="button"
                onClick={() => i + 1 < step && setStep((i + 1) as 1|2|3)}
                className="flex items-center gap-2 flex-1 text-left">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i+1 < step ? "bg-green-500 text-white" : i+1 === step ? "bg-brand-700 text-white" : "bg-dark-600 text-gray-500"
                }`}>{i+1 < step ? "✓" : i+1}</div>
                <span className={`text-sm font-medium hidden sm:block ${
                  i+1 === step ? "text-brand-400" : i+1 < step ? "text-green-400" : "text-gray-500"
                }`}>{s}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 hidden sm:block ${i+1 < step ? "bg-green-500/40" : "bg-dark-600"}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Step 1 ── */}
          {step === 1 && (<>
            <div className="card p-6 space-y-5">
              <h3 className="font-semibold text-white text-lg">Game Details</h3>
              <div>
                <label className="label-base">Game Title *</label>
                <input type="text" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Spider-Man 2" required className="input-base" />
              </div>
              <div>
                <label className="label-base">Platform *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {PLATFORMS.map((p) => {
                    const cfg = PLATFORM_CONFIG[p] ?? PLATFORM_CONFIG["Other"];
                    const Logo = cfg.Logo;
                    const sel  = form.platform === p;
                    return (
                      <button key={p} type="button" onClick={() => setForm({ ...form, platform: p })}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          sel ? `${cfg.colorClass} border-current` : "bg-dark-700 border-dark-500 text-gray-400 hover:border-dark-400"
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
                {form.edition && <p className="mt-1.5 text-xs text-amber-400">🏷️ Will show <strong>{form.edition} Edition</strong> badge</p>}
              </div>
              <div>
                <label className="label-base">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe condition, included DLC, reason for selling…" rows={4} className="input-base resize-none" />
              </div>
            </div>
            {formError && <ErrorBanner message={formError} onDismiss={() => setFormError("")} />}
            <button type="button" onClick={() => {
              setFormError("");
              if (!form.title) { setFormError("Please enter a game title"); return; }
              if (!form.platform) { setFormError("Please select a platform"); return; }
              setStep(2);
            }} className="btn-primary w-full">Continue →</button>
          </>)}

          {/* ── Step 2 ── */}
          {step === 2 && (<>
            <div className="card p-6 space-y-5">
              <h3 className="font-semibold text-white text-lg">Condition & Photos</h3>
              <div>
                <label className="label-base">Condition *</label>
                <div className="space-y-2 mt-1">
                  {CONDITIONS.map(([cond, desc]) => (
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
                <label className="label-base">Photos <span className="text-gray-500 font-normal">(up to 6)</span></label>
                <div className="grid grid-cols-3 gap-3 mt-1">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-dark-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                      {i === 0 && <div className="absolute bottom-2 left-2 bg-brand-500/90 rounded-md px-2 py-0.5 text-xs font-semibold text-white">Cover</div>}
                    </div>
                  ))}
                  {uploadingImages && (
                  <div className="w-full aspect-square rounded-xl bg-dark-700 border-2 border-dashed border-brand-500/50 flex flex-col items-center justify-center gap-2">
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
                <p className="text-xs text-gray-500 mt-2">First photo will be the cover image shown in search.</p>
              </div>
            </div>
            {(uploadError || formError) && (
              <ErrorBanner message={uploadError || formError} onDismiss={() => { setUploadError(""); setFormError(""); }} />
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              <button type="button" onClick={() => {
                setFormError("");
                if (!form.condition) { setFormError("Please select a condition"); return; }
                setStep(3);
              }} className="btn-primary flex-[2]">Continue →</button>
            </div>
          </>)}

          {/* ── Step 3 ── */}
          {step === 3 && (<>
            <div className="card p-6 space-y-5">
              <h3 className="font-semibold text-white text-lg">Price & Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base">Asking Price (CAD) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="number" value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0.00" min="0" step="0.01" required className="input-base pl-11" />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label-base">
                    Your General Location *
                    <span className="text-gray-500 font-normal ml-1 text-xs">(city or postal code only)</span>
                  </label>
                  <LocationInput value={form.location} onChange={handleLocationChange} isValid={locationValid} required />
                  {form.fuzzyLat && (
                    <div className="mt-3">
                      <p className="text-xs text-green-400 flex items-center gap-1 mb-2">
                        ✓ Location pinned — buyers will see this approximate area
                      </p>
                      <LocationMapPreview
                        fuzzyLat={parseFloat(form.fuzzyLat)}
                        fuzzyLng={parseFloat(form.fuzzyLng)}
                        label={form.location}
                        radiusKm={3}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              {form.title && (
                <div className="bg-dark-700/50 border border-dark-500 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Preview</p>
                  <div className="flex items-start gap-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${platformConfig?.bgGlow ?? "bg-dark-600"}`}>
                      {PlatformLogo
                        ? <PlatformLogo className={`w-8 h-8 ${platformConfig?.colorClass.split(" ")[1] ?? "text-gray-400"}`} />
                        : <span className="text-2xl">🎮</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{form.title}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {form.platform && platformConfig && (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${platformConfig.colorClass}`}>
                            {PlatformLogo && <PlatformLogo className="w-2.5 h-2.5" />}{form.platform}
                          </span>
                        )}
                        {form.condition && (
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-orange-500/10 text-orange-400 border-orange-500/25">{form.condition}</span>
                        )}
                        {form.edition && (
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/25">🏷️ {form.edition} Edition</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        {form.price && <span className="font-bold text-brand-400">${form.price} CAD</span>}
                        {form.location && <span className="text-gray-500 text-xs">📍 {form.location}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {formError && <ErrorBanner message={formError} onDismiss={() => setFormError("")} />}
            <div className="flex gap-3 pb-10">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
              <button type="submit" disabled={loading || !form.price || !form.location || !locationValid} className="btn-primary flex-[2]">
                {loading ? "Posting…" : "🚀 Post Listing"}
              </button>
            </div>
          </>)}
        </form>
      </main>
    </div>
  );
}
