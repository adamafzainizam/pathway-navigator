import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pathway Navigator",
  description:
    "Mechanical answers about Malaysian education pathways: accreditation, MQF levels, credit transfer caps, APEL routes.",
};

// NOTE: `lang` is hardcoded here only because route-level i18n (/ms, /en) is not
// built yet — see AGENTS.md §4 "explicitly deferred". When the locale segment
// lands, this becomes a [locale] layout and `lang` comes from the route param.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
