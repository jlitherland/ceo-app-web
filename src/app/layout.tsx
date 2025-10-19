import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CEO App - Music Business Management",
  description: "Manage your music business with automated contract analysis, financial tracking, and streaming analytics.",
  keywords: ["music business", "contract analysis", "streaming analytics", "financial management"],
  authors: [{ name: "CEO App" }],
  openGraph: {
    title: "CEO App - Music Business Management",
    description: "Manage your music business with automated tools",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <WebVitalsReporter />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
