import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoodyNick - Custom Product Design",
  description: "Design your own custom products with our intuitive design tool. Create unique designs with artwork and text on high-quality products.",
};

import Navbar from "@/components/Navbar";
import { PricingProvider } from "@/state/pricing/pricingStore";
import StickyPriceBar from "@/components/pricing/StickyPriceBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PricingProvider>
          <Navbar />
          {children}
          <StickyPriceBar />
        </PricingProvider>
      </body>
    </html>
  );
}
