import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getNavigation } from "@/lib/docs";
import { buildLanguageHref, getDictionary } from "@/lib/i18n";

const LANG = "en" as const;

export default function HomePageEn() {
  const language = LANG;
  const navigation = getNavigation(language);
  const labels = getDictionary(language);
  const flatChapters =
    navigation.sections.length === 1 &&
    !navigation.sections[0]?.title &&
    !navigation.sections[0]?.description
      ? navigation.sections[0].items
      : null;
  const featuredGuide = flatChapters ? flatChapters[0] : navigation.sections[0]?.items[0];
  const totalPages = flatChapters
    ? flatChapters.length
    : navigation.sections.reduce((count, section) => count + section.items.length, 0);

  return (
    <main className="home-shell">
      <header className="home-topbar">
        <Link className="brand-lockup" href="/en">
          <span className="brand-badge">OC</span>
          <div className="brand-copy">
            <strong>{navigation.site.title}</strong>
            <p>{navigation.site.tagline}</p>
          </div>
        </Link>
        <div className="topbar-actions">
          <Link className="ghost-link" href="/en/docs">
            {labels.startReading}
          </Link>
          <LanguageSwitcher currentLanguage={language} pathname="/" />
        </div>
      </header>

      <section className="hero-surface">
        <div className="hero-layout">
          <div className="hero-copy-column">
            <p className="eyebrow">{labels.heroEyebrow}</p>
            <h1>{navigation.site.title}</h1>
            <p className="hero-copy">{navigation.site.description}</p>
            <div className="hero-actions">
              <Link
                className="primary-action"
                href={
                  featuredGuide
                    ? buildLanguageHref(`/docs/${featuredGuide.slug}`, language)
                    : "/en/docs"
                }
              >
                {labels.startReading}
              </Link>
            </div>
            <div className="hero-meta-grid">
              <article className="hero-meta-card">
                <span>{labels.guideOutlineLabel}</span>
                <strong>{totalPages} {labels.pagesLabel}</strong>
                <p>{navigation.site.tagline}</p>
              </article>
              <article className="hero-meta-card">
                <span>{labels.coverageLabel}</span>
                <strong>{navigation.site.tagline}</strong>
                <p>{navigation.site.description}</p>
              </article>
              <article className="hero-meta-card">
                <span>{labels.featuredGuideLabel}</span>
                <strong>{featuredGuide?.title ?? navigation.site.title}</strong>
                <p>{navigation.site.description}</p>
              </article>
            </div>
          </div>

          <aside className="guide-card">
            <p className="section-label">{labels.guideOutlineLabel}</p>
            <h2>{navigation.site.title}</h2>
            <p className="guide-card-copy">{navigation.site.tagline}</p>
            <ol className="hero-outline">
              {(flatChapters ?? navigation.sections.flatMap((s) => s.items)).map((item) => (
                <li key={item.slug}>
                  <div>
                    <strong>{item.title}</strong>
                    {item.description ? <p>{item.description}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="section-grid">
        {(flatChapters ?? navigation.sections.flatMap((s) => s.items)).map((item) => (
          <article className="section-card" key={item.slug}>
            <div className="section-card-header">
              <p className="section-label">{String(item.order).padStart(2, "0")}</p>
            </div>
            <h2>{item.title}</h2>
            {item.description ? <p>{item.description}</p> : null}
            <Link className="secondary-action" href={buildLanguageHref(`/docs/${item.slug}`, language)}>
              {labels.startReading}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
