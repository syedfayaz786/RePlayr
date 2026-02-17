"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload, X, MapPin, DollarSign, Gamepad2 } from "lucide-react";
import { PLATFORMS, CONDITIONS } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    platform: "",
    edition: "",
    condition: "",
    location: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (status === "loading") return null;
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 6) {
      toast.error("Maximum 6 images allowed");
      return;
    }
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.platform) { toast.error("Please select a platform"); return; }
    if (!form.condition) { toast.error("Please select a condition"); return; }
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
      toast.error(err.message ?? "Failed to post listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">Sell a Game</h1>
          <p className="text-gray-400">List your game disc and find a local buyer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div className="card p-6">
            <h3 className="font-semibold text-white mb-4">Photos</h3>
            <div className="grid grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-dark-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-dark-500 hover:border-brand-500 flex flex-col items-center justify-center cursor-pointer transition-colors bg-dark-700/50">
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-400">Add Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Up to 6 photos. First photo will be the cover.</p>
          </div>

          {/* Game Details */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-white">Game Details</h3>

            <div>
              <label className="label-base">Game Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Spider-Man 2"
                required
                className="input-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base">Platform *</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="input-base"
                >
                  <option value="">Select platform</option>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">Condition *</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="input-base"
                >
                  <option value="">Select condition</option>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label-base">Edition / Version</label>
              <input
                type="text"
                value={form.edition}
                onChange={(e) => setForm({ ...form, edition: e.target.value })}
                placeholder="e.g. Standard, Deluxe, GOTY"
                className="input-base"
              />
            </div>

            <div>
              <label className="label-base">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the game, any scratches, included DLC, etc."
                rows={4}
                className="input-base resize-none"
              />
            </div>
          </div>

          {/* Pricing & Location */}
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-white">Price & Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base">Asking Price (CAD) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    className="input-base pl-11"
                  />
                </div>
              </div>
              <div>
                <label className="label-base">Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Toronto, ON"
                    required
                    className="input-base pl-11"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/" className="btn-secondary flex-1 text-center">Cancel</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Posting..." : "Post Listing"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
