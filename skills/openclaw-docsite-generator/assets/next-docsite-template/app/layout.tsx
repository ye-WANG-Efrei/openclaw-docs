import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "__DOCSITE_TITLE__",
  description: "__DOCSITE_DESCRIPTION__",
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
