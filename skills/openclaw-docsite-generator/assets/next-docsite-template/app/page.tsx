import Link from "next/link";
import { getNavigation } from "@/lib/docs";

export default function HomePage() {
  const navigation = getNavigation();

  return (
    <main className="home-shell">
      <section className="hero-card">
        <p className="eyebrow">OpenClaw Documentation</p>
        <h1>{navigation.site.title}</h1>
        <p className="hero-copy">{navigation.site.description}</p>
        <div className="hero-actions">
          <Link className="primary-action" href="/docs">
            Start Reading
          </Link>
          <span className="hero-tagline">{navigation.site.tagline}</span>
        </div>
      </section>

      <section className="section-grid">
        {navigation.sections.map((section) => {
          const firstPage = section.items[0];
          return (
            <article className="section-card" key={section.id}>
              <p className="section-label">{section.title}</p>
              <h2>{firstPage?.title ?? section.title}</h2>
              <p>{section.description}</p>
              {firstPage ? (
                <Link className="secondary-action" href={`/docs/${firstPage.slug}`}>
                  Open {section.title}
                </Link>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}
