import Link from "next/link";

export const metadata = { title: "About · Eduardo Pereira" };

// Placeholder until the About page is designed (spec §11).
export default function About() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "20vh 16px" }}>
      <h1>About me</h1>
      <p>Coming soon.</p>
      <Link href="/">← Back to the journey</Link>
    </main>
  );
}
