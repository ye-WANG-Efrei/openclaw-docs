import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SearchBox } from "@/components/search-box";
import { MobileNav } from "@/components/mobile-nav";
import { AnnotationSystem } from "@/components/annotation-system";
import { CommentsSection } from "@/components/comments-section";
import { CroissantLogo } from "@/components/logo";
import type { SearchEntry, SiteNavigation } from "@/lib/docs";
import { buildLanguageHref, type Language, type UiDictionary } from "@/lib/i18n";

export function DocsShell({
  children,
  currentPath,
  currentSlug,
  language,
  labels,
  navigation,
  searchEntries,
}: {
  children: ReactNode;
  currentPath: string;
  currentSlug: string;
  language: Language;
  labels: UiDictionary;
  navigation: SiteNavigation;
  searchEntries: SearchEntry[];
}) {
  return (
    <div className="docs-shell">
      {/* ── Fixed dark sidebar ── */}
      <aside className="docs-sidebar-panel">
        {/* Brand */}
        <Link className="sidebar-brand" href={buildLanguageHref("/", language)}>
          <CroissantLogo size={32} variant="dark" />
          <div>
            <div className="sidebar-brand-name">{navigation.site.title}</div>
            <div className="sidebar-brand-tag">{navigation.site.tagline}</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navigation.sections.map((section) => {
            const showTitle = Boolean(section.title?.trim());
            return (
              <div className="sidebar-section" key={section.id}>
                {showTitle && (
                  <div className="sidebar-section-title">{section.title}</div>
                )}
                {section.items.map((item) => {
                  const active = item.slug === currentSlug;
                  return (
                    <Link
                      key={item.slug}
                      className={active ? "sidebar-link active" : "sidebar-link"}
                      href={buildLanguageHref(`/docs/${item.slug}`, language)}
                    >
                      <span>{item.title}</span>
                      {item.description ? <small>{item.description}</small> : null}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Main content column ── */}
      <div className="docs-main-col">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-actions" style={{ marginLeft: "auto" }}>
            <SearchBox
              ariaLabel={labels.docSearchAria}
              entries={searchEntries}
              language={language}
              placeholder={labels.searchPlaceholder}
            />
            <LanguageSwitcher currentLanguage={language} pathname={currentPath} />
            <MobileNav
              currentSlug={currentSlug}
              language={language}
              navigation={navigation}
            />
          </div>
        </header>

        {/* Doc content */}
        <main className="doc-main">
          {children}
          <CommentsSection articleSlug={currentSlug} />
        </main>
      </div>

      <AnnotationSystem pageSlug={currentSlug} />
    </div>
  );
}
