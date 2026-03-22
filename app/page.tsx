import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SearchBar } from "@/components/listings/SearchBar";
import { ListingsGrid } from "@/components/listings/ListingsGrid";
import { prisma } from "@/lib/prisma";
import { Gamepad2, Users, ShieldCheck } from "lucide-react";

async function getStats() {
  try {
    const [totalListings, totalUsers] = await Promise.all([
      prisma.listing.count({ where: { status: "active" } }),
      prisma.user.count(),
    ]);
    return { totalListings, totalUsers };
  } catch {
    return { totalListings: 0, totalUsers: 0 };
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const stats = await getStats();
  const isSearching = !!(
    searchParams.q || searchParams.platform ||
    searchParams.condition || searchParams.minPrice || searchParams.maxPrice
  );

  return (
    <div className="min-h-screen flex flex-col" style={{background: "var(--bg-base)"}}>
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{paddingTop: 64, paddingBottom: 56}}>

        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{background: "linear-gradient(160deg, #080b18 0%, #05070A 60%)"}} />
          {/* Cyan ambient — top-left */}
          <div className="absolute -top-20 left-1/3 w-[480px] h-[320px] rounded-full opacity-25"
            style={{background: "radial-gradient(ellipse, #00e8f5 0%, transparent 68%)", filter: "blur(72px)"}} />
          {/* Violet ambient — right */}
          <div className="absolute top-0 right-1/4 w-[360px] h-[280px] rounded-full opacity-15"
            style={{background: "radial-gradient(ellipse, #7c3aed 0%, transparent 70%)", filter: "blur(64px)"}} />
          {/* Ground fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24"
            style={{background: "linear-gradient(to bottom, transparent, var(--bg-base))"}} />
        </div>

        {/* Hero content — constrained to 680px, centred */}
        <div className="relative mx-auto px-6 text-center animate-fade-in" style={{maxWidth: 680}}>

          {/* Eyebrow tag */}
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(0,240,255,0.06)",
              border: "1px solid rgba(0,240,255,0.12)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--accent)",
            }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background: "var(--accent)"}} />
            Now live in your city
          </div>

          {/* Headline */}
          <h1 className="font-display font-extrabold text-white mb-4"
            style={{fontSize: "clamp(34px, 5.5vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.04em"}}>
            Local Game Trading,{" "}
            <span className="gradient-text">Made Easy</span>
          </h1>

          {/* Subline */}
          <p className="mb-10" style={{
            fontSize: 16,
            lineHeight: 1.65,
            color: "var(--text-secondary)",
            maxWidth: 480,
            margin: "0 auto 40px",
            letterSpacing: "-0.01em",
          }}>
            Buy, sell and trade physical game discs with players in your city.
            No shipping. No strangers. Just local trades done right.
          </p>

          {/* Stats row — 3 columns with dividers */}
          <div className="inline-flex items-center gap-0 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
            {[
              { icon: Gamepad2,    label: "Active listings", value: stats.totalListings.toLocaleString() },
              { icon: Users,       label: "Gamers",          value: stats.totalUsers.toLocaleString() },
              { icon: ShieldCheck, label: "Trusted",         value: "100%" },
            ].map(({ icon: Icon, label, value }, i) => (
              <div key={label} className="flex items-center gap-3 px-6 py-4" style={{
                borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{color: "var(--accent)", opacity: 0.8}} />
                <div className="text-left">
                  <div className="font-display font-bold"
                    style={{fontSize: 20, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--text-primary)"}}>
                    {value}
                  </div>
                  <div style={{fontSize: 11, color: "var(--text-muted)", marginTop: 2, letterSpacing: "0.01em"}}>
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search + Listings ───────────────────────────────────────── */}
      <main className="flex-1 w-full" style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 24px 80px",
        width: "100%",
      }}>

        {/* Search bar — full width, generous vertical spacing */}
        <div style={{marginBottom: 32}}>
          <Suspense><SearchBar /></Suspense>
        </div>

        {/* Listings grid with suspense fallback */}
        <Suspense fallback={
          <div>
            {/* Section label skeleton */}
            <div className="skeleton h-5 w-32 mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton" style={{aspectRatio: "3/4", borderRadius: 14}} />
              ))}
            </div>
          </div>
        }>
          <ListingsGrid isSearching={isSearching} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
