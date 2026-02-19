-- Migration 002: Add location privacy fields
-- Run this in your Supabase SQL Editor to enable the full map privacy features.
-- Safe to run multiple times (uses IF NOT EXISTS).

-- Add fuzzy coordinate columns to Listing (used for buyer-facing map circles)
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "fuzzyLat" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "fuzzyLng" DOUBLE PRECISION;

-- Create LocationRequest table (buyer → seller address request flow)
CREATE TABLE IF NOT EXISTS "LocationRequest" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LocationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LocationRequest_listingId_requesterId_key"
    ON "LocationRequest"("listingId", "requesterId");

ALTER TABLE "LocationRequest"
    ADD CONSTRAINT "LocationRequest_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LocationRequest"
    ADD CONSTRAINT "LocationRequest_requesterId_fkey"
    FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
