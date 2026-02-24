-- Add listingId to Review
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "listingId" TEXT;
ALTER TABLE "Review" ADD CONSTRAINT "Review_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "Review_authorId_listingId_key" ON "Review"("authorId", "listingId");

-- Create Sale table
CREATE TABLE IF NOT EXISTS "Sale" (
  "id"        TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "sellerId"  TEXT NOT NULL,
  "buyerId"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Sale_listingId_key" ON "Sale"("listingId");
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_sellerId_fkey"  FOREIGN KEY ("sellerId")  REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_buyerId_fkey"   FOREIGN KEY ("buyerId")   REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
