# RePlayr 🎮

The local marketplace for buying and selling video game discs. Built with Next.js 14, Prisma, and PostgreSQL.

---

## Quick Start

### 1. Clone and install
```bash
git clone <your-repo>
cd replayr
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:
- `DATABASE_URL` — your PostgreSQL connection string
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32` to generate one
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev

### 3. Set up the database

**Option A — Let Prisma create everything (recommended for new DBs):**
```bash
npx prisma db push
```

**Option B — Run the migration SQL manually:**
```bash
psql $DATABASE_URL < prisma/migrations/001_initial/migration.sql
```

**Option C — Vercel/Supabase deployment:**
```bash
npx prisma migrate deploy
```

### 4. Generate Prisma client
```bash
npx prisma generate
```

### 5. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel + Supabase)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy the **Transaction pooler** connection string as `DATABASE_URL`
3. Copy the **Direct connection** string as `DIRECT_URL` (uncomment in `prisma/schema.prisma`)
4. Push to Vercel — the build script runs `prisma generate && next build` automatically
5. Set all env vars in Vercel dashboard

---

## Location Privacy

RePlayr uses a Facebook Marketplace-style location system:

- **Sellers** enter only a city or postal code — never a street address
- **Buyers** see a fuzzy circle on the map (±500 m randomised from the actual location)
- **Exact coords** are stored in the DB but never sent to buyers via any API
- **Address requests**: buyers can request the pickup area, which sellers approve or deny. Only then is a general area label shared via private message.

---

## Tech Stack

- **Next.js 14** (App Router)
- **Prisma** + **PostgreSQL**
- **NextAuth.js** (Google, GitHub, email/password)
- **Tailwind CSS** + **Syne** font
- **Leaflet** (fuzzy location maps)
- **Nominatim/OpenStreetMap** (free geocoding, no API key needed)
