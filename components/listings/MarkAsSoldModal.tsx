"use client";
import Link from "next/link";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, CheckCircle2, Globe, ShoppingBag, Search, User, MapPin, Star, ChevronRight, Loader2, Send, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type SearchUser = {
  id: string; name: string | null; image: string | null; location: string | null;
  createdAt: string; _count: { listings: number; salesAsBuyer: number };
};
type Step = "where" | "search" | "confirm" | "review" | "done";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1.5">
      {[1,2,3,4,5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110">
          <Star className={`w-8 h-8 transition-colors ${s <= (hovered||value) ? "fill-amber-400 text-amber-400" : "text-gray-600"}`} />
        </button>
      ))}
    </div>
  );
}
const RATING_LABELS: Record<number,string> = {1:"Poor",2:"Fair",3:"Good",4:"Great",5:"Excellent!"};

interface Props { listingId: string; listingTitle: string; onClose: () => void; onSold: () => void; }

export function MarkAsSoldModal({ listingId, listingTitle, onClose, onSold }: Props) {
  const router = useRouter();
  const [step, setStep]                 = useState<Step>("where");
  const [soldWhere, setSoldWhere]       = useState<"replayr"|"outside"|null>(null);
  const [selectedUser, setSelectedUser] = useState<SearchUser|null>(null);
  const [saving, setSaving]             = useState(false);
  const [query, setQuery]               = useState("");
  const [results, setResults]           = useState<SearchUser[]>([]);
  const [searching, setSearching]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef                       = useRef<HTMLDivElement>(null);
  const debounceRef                     = useRef<ReturnType<typeof setTimeout>|null>(null);
  const [rating, setRating]             = useState(0);
  const [comment, setComment]           = useState("");
  const [sendingReview, setSendingReview] = useState(false);
  const [reviewSent, setReviewSent]     = useState(false);

  const doSearch = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch("/api/users/search?q=" + encodeURIComponent(q));
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setDropdownOpen(true);
    } catch { setResults([]); } finally { setSearching(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length === 0) { setResults([]); setDropdownOpen(false); return; }
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const memberSince = (iso: string) => {
    const d = new Date(iso);
    return "Member since " + d.toLocaleString("default", { month: "short", year: "numeric" });
  };

  const confirmSale = async () => {
    setSaving(true);
    try {
      if (soldWhere === "replayr" && selectedUser) {
        const res = await fetch("/api/sales", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, buyerId: selectedUser.id }),
        });
        if (!res.ok) throw new Error();
        setStep("review");
      } else {
        const res = await fetch("/api/listings/" + listingId, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "sold" }),
        });
        if (!res.ok) throw new Error();
        toast.success("Marked as sold!");
        onSold(); router.refresh();
      }
    } catch { toast.error("Something went wrong"); } finally { setSaving(false); }
  };

  const submitReview = async () => {
    if (!selectedUser || rating === 0) return;
    setSendingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: selectedUser.id, listingId, rating, comment: comment.trim()||null, role: "seller" }),
      });
      if (res.ok) {
        setReviewSent(true); setStep("done"); toast.success("Review sent!"); onSold(); router.refresh();
      } else {
        const d = await res.json(); toast.error(d.error ?? "Failed to send review");
      }
    } catch { toast.error("Something went wrong"); } finally { setSendingReview(false); }
  };

  const progressSteps: Step[] = soldWhere === "outside" ? ["where","confirm"] : ["where","search","confirm","review"];

  const Avatar = ({ user, size }: { user: SearchUser; size: number }) => user.image
    ? <Image src={user.image} alt={user.name??""} width={size} height={size} className={`w-${size/4} h-${size/4} rounded-full object-cover`} />
    : <div className={`w-${size/4} h-${size/4} rounded-full bg-brand-500/30 flex items-center justify-center text-brand-300 font-bold text-sm flex-shrink-0`}>{(user.name??"?")[0].toUpperCase()}</div>;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md relative overflow-visible">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"><X className="w-5 h-5" /></button>

        <div className="flex gap-1.5 px-6 pt-5">
          {progressSteps.map((s) => {
            const idx = progressSteps.indexOf(step==="done"?"review":step);
            const ti  = progressSteps.indexOf(s);
            return <div key={s} className={"h-1 flex-1 rounded-full transition-all " + (ti<idx?"bg-brand-600":ti===idx?"bg-brand-400":"bg-dark-600")} />;
          })}
        </div>

        <div className="p-6 pt-4">

          {step === "where" && (
            <div>
              <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-5 h-5 text-green-400" /><h3 className="font-display font-bold text-white text-lg">Mark as Sold</h3></div>
              <p className="text-sm text-gray-400 mb-5"><span className="text-white font-medium">{listingTitle}</span><br/>Where did this sale happen?</p>
              <div className="space-y-3">
                <button onClick={() => { setSoldWhere("replayr"); setStep("search"); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-dark-600 bg-dark-800 hover:border-brand-500/60 hover:bg-dark-700 transition-all group text-left">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-500/25 transition-colors"><ShoppingBag className="w-5 h-5 text-brand-400" /></div>
                  <div className="flex-1"><p className="font-semibold text-white text-sm">Sold on RePlayr</p><p className="text-xs text-gray-400 mt-0.5">Find the buyer and request a review</p></div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand-400 transition-colors" />
                </button>
                <button onClick={() => { setSoldWhere("outside"); setStep("confirm"); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-dark-600 bg-dark-800 hover:border-gray-500/60 hover:bg-dark-700 transition-all group text-left">
                  <div className="w-10 h-10 rounded-xl bg-gray-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-500/25 transition-colors"><Globe className="w-5 h-5 text-gray-400" /></div>
                  <div className="flex-1"><p className="font-semibold text-white text-sm">Sold elsewhere</p><p className="text-xs text-gray-400 mt-0.5">Facebook, Kijiji, in-person, etc.</p></div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </button>
              </div>
            </div>
          )}

          {step === "search" && (
            <div>
              <button onClick={() => setStep("where")} className="text-xs text-gray-500 hover:text-gray-300 mb-3 transition-colors">Back</button>
              <h3 className="font-display font-bold text-white text-lg mb-1">Find the Buyer</h3>
              <p className="text-sm text-gray-400 mb-4">Optional — search by name or email to link the buyer.</p>
              <div ref={searchRef} className="relative mb-4 overflow-visible">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />}
                  <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
                    onFocus={() => setDropdownOpen(true)} placeholder="Search by name or email..."
                    className="input-base pl-10 pr-10" autoFocus />
                </div>
                {dropdownOpen && results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl z-[200] max-h-56 overflow-y-auto">
                    {results.map((user) => (
                      <button key={user.id} onClick={() => { setSelectedUser(user); setQuery(user.name??""); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 transition-colors text-left border-b border-dark-700 last:border-0">
                        {user.image
                          ? <Image src={user.image} alt={user.name??"User"} width={36} height={36} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                          : <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-300 text-sm font-bold flex-shrink-0">{(user.name??"?")[0].toUpperCase()}</div>
                        }
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">{user.name??"Anonymous"}</p>
                            <Link href={`/users/${user.id}`} target="_blank" onClick={e => e.stopPropagation()}
                              className="text-xs text-brand-400 hover:text-brand-300 flex-shrink-0 transition-colors">View profile</Link>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {user.location && <span className="flex items-center gap-0.5 text-xs text-gray-500"><MapPin className="w-3 h-3" />{user.location}</span>}
                            <span className="text-xs text-gray-600">{memberSince(user.createdAt)}</span>
                          </div>
                          <div className="mt-0.5">
                            <span className="text-xs text-gray-600">{user._count.salesAsBuyer} purchase{user._count.salesAsBuyer!==1?"s":""}</span>
                          </div>
                        </div>
                        {selectedUser?.id === user.id && <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
                {dropdownOpen && !searching && results.length === 0 && query.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-600 rounded-xl p-4 text-center shadow-2xl z-50">
                    <User className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">No users found</p>
                  </div>
                )}
              </div>
              {selectedUser && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 mb-4">
                  {selectedUser.image
                    ? <Image src={selectedUser.image} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                    : <div className="w-8 h-8 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-300 text-xs font-bold">{(selectedUser.name??"?")[0].toUpperCase()}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{selectedUser.name}</p>
                    {selectedUser.location && <p className="text-xs text-gray-400">{selectedUser.location}</p>}
                  </div>
                  <button onClick={() => { setSelectedUser(null); setQuery(""); }} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setSelectedUser(null); setStep("confirm"); }} className="btn-secondary flex-1 text-sm">Skip</button>
                <button onClick={() => setStep("confirm")} disabled={!selectedUser} className="btn-primary flex-1 text-sm disabled:opacity-40">
                  {selectedUser ? "Continue" : "Select a buyer"}
                </button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div>
              <button onClick={() => setStep(soldWhere==="replayr"?"search":"where")} className="text-xs text-gray-500 hover:text-gray-300 mb-3 transition-colors">Back</button>
              <h3 className="font-display font-bold text-white text-lg mb-1">Confirm Sale</h3>
              <p className="text-sm text-gray-400 mb-5">Please review the details below.</p>
              <div className="mb-6 rounded-xl border border-dark-600 overflow-hidden">
                <div className="flex justify-between text-sm px-4 py-3 border-b border-dark-700">
                  <span className="text-gray-400">Listing</span>
                  <span className="text-white font-medium text-right max-w-xs truncate">{listingTitle}</span>
                </div>
                <div className={"flex justify-between text-sm px-4 py-3 " + (soldWhere==="replayr"?"border-b border-dark-700":"")}>
                  <span className="text-gray-400">Sold via</span>
                  <span className={"font-medium " + (soldWhere==="replayr"?"text-brand-400":"text-gray-300")}>
                    {soldWhere==="replayr"?"RePlayr":"Outside RePlayr"}
                  </span>
                </div>
                {soldWhere === "replayr" && (
                  <div className="flex justify-between items-center text-sm px-4 py-3">
                    <span className="text-gray-400">Buyer</span>
                    {selectedUser ? (
                      <div className="flex items-center gap-2">
                        {selectedUser.image
                          ? <Image src={selectedUser.image} alt="" width={20} height={20} className="w-5 h-5 rounded-full" />
                          : <div className="w-5 h-5 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-300 text-xs font-bold">{(selectedUser.name??"?")[0].toUpperCase()}</div>
                        }
                        <span className="text-white font-medium">{selectedUser.name}</span>
                      </div>
                    ) : <span className="text-gray-500 italic text-xs">Not linked</span>}
                  </div>
                )}
              </div>
              <button onClick={confirmSale} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle2 className="w-4 h-4" /> Confirm and Mark Sold</>}
              </button>
            </div>
          )}

          {step === "review" && selectedUser && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-brand-500/30">
                  {selectedUser.image
                    ? <Image src={selectedUser.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-brand-300 font-bold">{(selectedUser.name??"?")[0].toUpperCase()}</div>
                  }
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg leading-tight">Rate {selectedUser.name}</h3>
                  <p className="text-xs text-gray-400">How was {selectedUser.name} as a buyer?</p>
                </div>
              </div>
              <StarPicker value={rating} onChange={setRating} />
              {rating > 0 && <p className="text-sm font-medium text-amber-400 mt-1.5 mb-0">{RATING_LABELS[rating]}</p>}
              <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a comment (optional)..." rows={3}
                className="input-base resize-none mb-4 text-sm mt-3" />
              <div className="flex gap-2">
                <button onClick={() => { onSold(); router.refresh(); }} className="btn-secondary flex-1 text-sm">Skip review</button>
                <button onClick={submitReview} disabled={rating===0||sendingReview} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-40">
                  {sendingReview ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-3.5 h-3.5" /> Send Review</>}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-green-400" /></div>
              <h3 className="font-display font-bold text-white text-xl mb-2">All done!</h3>
              <p className="text-gray-400 text-sm mb-1">Your listing has been marked as sold.</p>
              {reviewSent && selectedUser && <p className="text-xs text-gray-500 mt-1">Your review of {selectedUser.name} was sent.</p>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
