import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FORGE LT20 | Tenacity Investments",
  description:
    "Tenacity Investments FORGE LT20 tax-aware equity appreciation dashboard for S&P 500 Core and Opportunistic holdings, candidate bench, tax lots, leverage, and covered-call overlay management.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
