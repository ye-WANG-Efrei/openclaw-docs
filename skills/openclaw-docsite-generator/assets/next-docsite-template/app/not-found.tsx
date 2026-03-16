import Link from "next/link";

export default function NotFound() {
  return (
    <main className="home-shell">
      <section className="hero-card">
        <p className="eyebrow">Page Not Found</p>
        <h1>The requested OpenClaw document does not exist.</h1>
        <p className="hero-copy">
          Check the sidebar, sync the navigation, or create the missing page with the generator script.
        </p>
        <div className="hero-actions">
          <Link className="primary-action" href="/docs">
            Open Docs Home
          </Link>
        </div>
      </section>
    </main>
  );
}
