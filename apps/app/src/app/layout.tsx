import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "../index.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Charlie Workflow Monitor",
  description: "Track and visualize Charlie automation workflows across Linear and GitHub",
  keywords: ["workflow automation", "charlie", "linear", "github", "monitoring"],
  authors: [{ name: "Charlie Team" }],
  openGraph: {
    title: "Charlie Workflow Monitor",
    description: "Track and visualize Charlie automation workflows",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
