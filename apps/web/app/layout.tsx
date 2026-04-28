import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteNavigation } from "@/components/site-navigation";
import "@chess-platform/ui/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Platform",
  description: "Play chess locally, online, or against AI."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AuthProvider>
          <SiteNavigation />
          {children}
        </AuthProvider>
      </body>
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
