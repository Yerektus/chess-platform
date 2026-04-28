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
    var activeTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = activeTheme;
    document.documentElement.style.colorScheme = activeTheme;
  } catch (error) {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";
  }
})();
`;
