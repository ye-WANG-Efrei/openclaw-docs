import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CroissantLogo } from "@/components/logo";
import { StatsRow } from "@/components/stats-row";
import { getNavigation } from "@/lib/docs";
import { buildLanguageHref, getDictionary } from "@/lib/i18n";

const DEFAULT_LANG = "zh" as const;

export default function HomePage() {
  const language = DEFAULT_LANG;
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
        <Link className="brand-lockup" href={buildLanguageHref("/", language)}>
          <span className="brand-badge">
            <CroissantLogo size={38} />
          </span>
          <div className="brand-copy">
            <strong>{navigation.site.title}</strong>
            <p>{navigation.site.tagline}</p>
          </div>
        </Link>
        <div className="topbar-actions">
          <Link
            className="ghost-link"
            href={
              featuredGuide
                ? buildLanguageHref(`/docs/${featuredGuide.slug}`, language)
                : buildLanguageHref("/docs", language)
            }
          >
            {labels.startReading}
          </Link>
          <LanguageSwitcher currentLanguage={language} pathname="/" />
        </div>
      </header>

      <section className="mission-surface">
        <div className="mission-inner">
          <h2 className="mission-headline">
            <span className="mission-line">让开发者看清</span>
            <span className="mission-line">AI 的方向，</span>
            <span className="mission-line-fade">构建属于你的 Agent。</span>
          </h2>
          <StatsRow articleCount={totalPages} lang="zh" />
        </div>
      </section>

      <section className="section-grid">
        {(flatChapters ?? navigation.sections.flatMap((section) => section.items)).map((item) => (
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
