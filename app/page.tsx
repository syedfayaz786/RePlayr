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
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── Compact centred hero ── */}
      <section className="relative overflow-hidden">
        {/* Hero background — layered gradient + glows */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Base gradient */}
          <div className="absolute inset-0" style={{background: "linear-gradient(135deg, #080a1a 0%, #0b0d24 50%, #0a1020 100%)"}} />
          {/* Cyan glow left */}
          <div className="absolute -top-10 left-1/4 w-[500px] h-[300px] rounded-full opacity-30" style={{background: "radial-gradient(ellipse, #06b6d4 0%, transparent 70%)", filter: "blur(60px)"}} />
          {/* Purple glow right */}
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] rounded-full opacity-20" style={{background: "radial-gradient(ellipse, #6366f1 0%, transparent 70%)", filter: "blur(60px)"}} />
          {/* Subtle cyan glow centre-bottom */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[100px] opacity-15" style={{background: "radial-gradient(ellipse, #06b6d4 0%, transparent 70%)", filter: "blur(40px)"}} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: "linear-gradient(rgba(6,182,212,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px"}} />
          {/* Bottom fade to page bg */}
          <div className="absolute bottom-0 left-0 right-0 h-12" style={{background: "linear-gradient(to bottom, transparent, #080a18)"}} />
        </div>

        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 text-center">
          <h1 className="font-display font-extrabold text-white mb-3"
            style={{fontSize:"clamp(32px,5vw,52px)", lineHeight:1.06, letterSpacing:"-0.04em"}}>
            Local Game Trading,{" "}
            <span className="gradient-text">Made Easy</span>
          </h1>
          <p className="font-body mb-5" style={{
            fontSize:12, fontWeight:500, letterSpacing:"0.12em",
            textTransform:"uppercase", color:"var(--text-muted)"
          }}>
            Trade<span className="mx-2" style={{color:"var(--accent)"}}>·</span>
            Play<span className="mx-2" style={{color:"var(--accent)"}}>·</span>
            Repeat
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: Gamepad2,    label: "Active",  value: stats.totalListings },
              { icon: Users,       label: "Gamers",  value: stats.totalUsers },
              { icon: ShieldCheck, label: "Trusted", value: "100%" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{color:"var(--accent)"}} />
                <span className="font-display font-semibold text-sm" style={{color:"var(--text-primary)", letterSpacing:"-0.02em"}}>{value}</span>
                <span style={{fontSize:13, color:"var(--text-muted)", letterSpacing:"-0.01em"}}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Listings (client-side, dynamic) ── */}
      <main className="flex-1 max-w-screen-2xl mx-auto px-4 sm:px-8 w-full py-5">
        <div className="mb-6">
          <Suspense><SearchBar /></Suspense>
        </div>
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card aspect-[3/4] animate-pulse bg-dark-700" />
            ))}
          </div>
        }>
          <ListingsGrid isSearching={isSearching} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
