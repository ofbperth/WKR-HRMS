import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบรายงานและบริหารความเสี่ยงโรงพยาบาล",
  description: "ระบบรายงาน incident และติดตามการบริหารความเสี่ยงของโรงพยาบาล",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="th"><body>{children}</body></html>;
}
