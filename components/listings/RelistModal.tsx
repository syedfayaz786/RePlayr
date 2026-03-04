"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, DollarSign, Loader2, Copy, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { PLATFORMS } from "@/lib/utils";
import { PLATFORM_CONFIG } from "@/components/ui/Badges";

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

interface ListingData {
  title: string;
  description: string | null;
  price: number;
  platform: string;
  edition: string | null;
  condition: string;
  location: string | null;
  images: string;
}

interface RelistModalProps {
  listingData: ListingData;
  onClose: () => void;
}

export function RelistModal({ listingData, onClose }: RelistModalProps) {
  const router = useRouter();

  const initialImages = (() => {
    try { return JSON.parse(listingData.images) as string[]; } catch { return []; }
  })();

  const [form, setForm] = useState({
    title:       listingData.title,
    description: listingData.description ?? "",
    price:       String(listingData.price),
    platform:    listingData.platform,
    edition:     listingData.edition ?? "",
    condition:   listingData.condition,
    location:    listingData.location ?? "",
  });
  const [images, setImages]   = useState<string[]>(initialImages);
  const [loading, setLoading] = useState(false);
  const [imgIdx, setImgIdx]   = useState(0);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const removeImage = (i: number) => {
    setImages((imgs) => imgs.filter((_, idx) => idx !== i));
    setImgIdx((idx) => Math.max(0, idx - 1));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 6) { toast.error("Max 6 images"); return; }
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const { url } = await res.json();
        if (url) setImages((imgs) => [...imgs, url]);
      } catch { toast.error("Upload failed"); }
    }
    e.target.value = "";
  };

  const submit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { toast.error("Enter a valid price"); return; }
    if (!form.platform) { toast.error("Select a platform"); return; }
    if (!form.condition) { toast.error("Select a condition"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price:  parseFloat(form.price),
          images: JSON.stringify(images),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Listing created!");
        onClose();
        router.push(`/listings/${data.id}`);
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Failed to create listing");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg max-h-[90vh] flex flex-col relative">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-600 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-brand-400" />
            <h3 className="font-display font-bold text-white text-lg">Relist as New</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Images */}
          <div>
            <label className="label-base mb-2 block">Photos ({images.length}/6)</label>
            {images.length > 0 && (
              <div className="relative mb-3 rounded-xl overflow-hidden bg-dark-700 aspect-video flex items-center justify-center">
                {images[imgIdx].startsWith("data:") ? (
                  <img src={images[imgIdx]} alt="" className="w-full h-full object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[imgIdx]} alt="" className="w-full h-full object-contain" />
                )}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button onClick={() => removeImage(imgIdx)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center text-white hover:bg-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/40"}`} />
                  ))}
                </div>
              </div>
            )}
            {images.length < 6 && (
              <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-dark-500 text-gray-400 hover:border-brand-500/50 hover:text-brand-400 cursor-pointer transition-colors text-sm">
                <span>+ Add photos</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="label-base">Title</label>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
              className="input-base" placeholder="Game title..." />
          </div>

          {/* Price */}
          <div>
            <label className="label-base">Price (CAD)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)}
                min="1" step="0.01" className="input-base pl-11" placeholder="0.00" />
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="label-base">Platform</label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map((p) => {
                const cfg = PLATFORM_CONFIG[p];
                const isActive = form.platform === p;
                return (
                  <button key={p} type="button" onClick={() => set("platform", p)}
                    className={`py-2 px-2 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      isActive ? "border-brand-500 bg-brand-500/20 text-brand-300" : "border-dark-600 bg-dark-800 text-gray-400 hover:border-dark-500"
                    }`}>
                    {cfg?.Logo && <cfg.Logo className="w-3.5 h-3.5" />}{cfg?.shortLabel ?? p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="label-base">Condition</label>
            <div className="space-y-1.5">
              {CONDITIONS.map(([label, desc]) => (
                <button key={label} type="button" onClick={() => set("condition", label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all text-left ${
                    form.condition === label ? "border-brand-500 bg-brand-500/10 text-white" : "border-dark-600 bg-dark-800 text-gray-300 hover:border-dark-500"
                  }`}>
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-gray-500 ml-2 hidden sm:inline">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Edition */}
          <div>
            <label className="label-base">Edition (optional)</label>
            <select value={form.edition} onChange={(e) => set("edition", e.target.value)} className="input-base">
              <option value="">Select edition...</option>
              {EDITIONS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="label-base">Description (optional)</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={3} className="input-base resize-none" placeholder="Any extra details..." />
          </div>

          {/* Location */}
          <div>
            <label className="label-base">Location (optional)</label>
            <input type="text" value={form.location} onChange={(e) => set("location", e.target.value)}
              className="input-base" placeholder="City, Province..." />
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-dark-600 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Copy className="w-4 h-4" /> Post Listing</>}
          </button>
        </div>

      </div>
    </div>
  );
}
