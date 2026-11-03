import { Pixelify_Sans } from "next/font/google";

const pixel = Pixelify_Sans({ variable: "--font-pixel", subsets: ["latin"] });

/** The handheld: a full-viewport dark frame the world and its controls live in. */
export default function WorldLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={pixel.variable} style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#0d0f14" }}>
      {children}
    </div>
  );
}
