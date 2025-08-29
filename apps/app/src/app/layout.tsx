import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "../index.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Charlie | Command Center",
    template: "%s | Charlie"
  },
  description: "Monitor and control your Charlie AI assistants",
  keywords: ["workflow automation", "charlie", "linear", "github", "ai assistant"],
  authors: [{ name: "Charlie Labs" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Charlie Command Center",
    description: "Monitor and control your Charlie AI assistants",
    type: "website",
  },
};

import { ReadyTile } from "@/components/ready-tile";
import { SharedHeader } from "@/components/shared-header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#010101]">
      <body className={`${inter.className} antialiased bg-[#010101]`}>
        <SharedHeader />
        <main className="pt-14">
          {children}
        </main>
        <ReadyTile />
      </body>
    </html>
  );
}
