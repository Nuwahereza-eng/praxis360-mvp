import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Praxis360 — From Feedback to Improvement",
  description:
    "AI-powered university intelligence platform that closes the loop between feedback, student voice, teaching evaluation, and measurable institutional improvement.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
