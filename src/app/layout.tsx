import type { Metadata } from "next";
import { Caveat, Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// handwriting for polaroid captions; not preloaded, so it's only fetched when a caption shows
const caveat = Caveat({ variable: "--font-hand", subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: "Eduardo Pereira · AI / ML / Software Engineer",
  description:
    "Portfolio of Eduardo Pereira, AI / ML / Software Engineer. Walk through the journey from Braga to Stockholm and explore the projects along the way.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
