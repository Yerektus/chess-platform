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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const themeInitScript = `
(function () {
  try {
    var theme = window.localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.dataset.theme = "dark";
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  } catch (error) {
    document.documentElement.removeAttribute("data-theme");
  }
})();
`;
