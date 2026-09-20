import type { Metadata } from "next";
import { Geist, Noto_Sans_Ethiopic } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoSansEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Abyssinia Digital Menu & KOT System",
  description: "Cloud-Based QR Digital Menu, Fasting Engine & Kitchen Order Ticketing (KOT) System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${notoSansEthiopic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col antialiased selection:bg-amber-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
