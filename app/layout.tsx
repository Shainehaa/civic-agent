import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

// Using the system font stack instead of next/font/google. This avoids
// a network fetch to Google Fonts at build time (which can fail in
// restricted environments like CI/CD or sandboxed builds) and is one
// less external dependency for your deployed app to worry about.

export const metadata: Metadata = {
  title: "Civic Agent",
  description:
    "Report civic issues with a photo. AI identifies, prioritizes, and tracks them to resolution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      {/* suppressHydrationWarning here only ignores attributes browser
          extensions inject into <body> before React loads (e.g. ColorZilla's
          cz-shortcut-listen). It does NOT hide real hydration bugs elsewhere
          in the app — those would still show up as errors on other elements. */}
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
