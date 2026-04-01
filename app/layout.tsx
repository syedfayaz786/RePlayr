import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#05070A",
};

export const metadata: Metadata = {
  title: "RePlayr — Trade Game Discs Locally",
  description:
    "Buy, sell and trade video game discs with people near you. RePlayr is the local marketplace for gamers.",
  keywords: ["video games", "game discs", "buy sell trade", "local marketplace", "PS5", "Xbox", "Nintendo Switch"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} ${plusJakarta.variable} font-body bg-dark-900 text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
