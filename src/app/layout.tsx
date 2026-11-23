import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_TITLE = "本当の自分｜誰にも見せない本音と向き合うAI";
const SITE_DESCRIPTION =
  "誰にも話せない本音や感情を、自分だけの空間でAIと一緒に見つめてみませんか。自分の気持ちを整理し、少しずつ本当の自分を理解していくためのサービスです。";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: SITE_TITLE,
    template: "%s | 本当の自分",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "本当の自分",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1324",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} h-full scroll-smooth`}>
      <body className="min-h-full bg-[#F7F8FA] text-slate-800 antialiased">
        <AnalyticsScripts />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
