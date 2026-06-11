import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบรายงานและบริหารความเสี่ยงโรงพยาบาล",
  description: "ระบบรายงาน incident และติดตามการบริหารความเสี่ยงของโรงพยาบาล",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icons/icon-32.png"],
  },
  appleWebApp: {
    capable: true,
    title: "WKR-HRMS",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f8d57",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="th"><body>{children}</body></html>;
}
