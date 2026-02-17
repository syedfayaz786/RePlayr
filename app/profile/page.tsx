"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { User, MapPin, Save, Star } from "lucide-react";
import toast from "react-hot-toast";
import { ListingCard } from "@/components/listings/ListingCard";
import { StarRating } from "@/components/ui/StarRating";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          setName(data.name ?? "");
          setBio(data.bio ?? "");
          setLocation(data.location ?? "");
          setListings(data.listings ?? []);
          setReviews(data.reviews ?? []);
        });
    }
  }, [session]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, location }),
      });
      if (res.ok) {
        await update({ name });
        toast.success("Profile saved!");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  const avgRating = reviews.length
    ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 w-full py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile card */}
          <div className="space-y-4">
            <div className="card p-6">
              <div className="flex flex-col items-center text-center mb-6">
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    width={80}
                    height={80}
                    className="rounded-full mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-3xl mb-3">
                    {session.user?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
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
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>

          {/* Listings & Reviews */}
          <div className="lg:col-span-2">
            <div className="flex gap-1 mb-6 bg-dark-800 rounded-xl p-1 border border-dark-600">
              {(["listings", "reviews"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                    activeTab === tab
                      ? "bg-brand-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab} ({tab === "listings" ? listings.length : reviews.length})
                </button>
              ))}
            </div>

            {activeTab === "listings" && (
              listings.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="mb-4">You haven&apos;t posted any listings yet</p>
                  <a href="/listings/new" className="btn-primary inline-flex">Post Your First Game</a>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listings.map((listing: any) => (
                    <ListingCard
                      key={listing.id}
                      listing={{
                        ...listing,
                        createdAt: listing.createdAt,
                        seller: { id: session.user.id, name: session.user.name, image: session.user.image },
                      }}
                    />
                  ))}
                </div>
              )
            )}

            {activeTab === "reviews" && (
              reviews.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Star className="w-10 h-10 mx-auto mb-3 text-gray-500" />
                  <p>No reviews yet — complete a trade to receive your first review!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="card p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 font-bold text-xs">
                          {review.author?.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {review.author?.name}
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-300">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
