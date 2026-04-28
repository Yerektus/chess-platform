import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteNavigation } from "@/components/site-navigation";
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
