import type { Metadata } from "next";
import DpAnalyticsBeacon from "@/components/marketing/dp-analytics-beacon";

export const metadata: Metadata = {
  title: "The Ultimate Pianist — VIP Waitlist",
  description:
    "Finally learn the pieces you bought but never played. Join the VIP waitlist for The Ultimate Pianist Masterclass and lock in your spot for just $1.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <DpAnalyticsBeacon />
    </>
  );
}
