import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Platform",
  description: "Play chess online, against AI, and review your games with analysis.",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
