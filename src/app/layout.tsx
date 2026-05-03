import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import DpAnalyticsBeacon from "@/components/dp-analytics-beacon";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "The Ultimate Pianist | Start Free",
  description:
    "Start The Ultimate Pianist free with the first 10 levels and 50 foundation lessons from Lionel Yu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cormorant.variable}`}>
        {children}
        <DpAnalyticsBeacon />
      </body>
    </html>
  );
}
