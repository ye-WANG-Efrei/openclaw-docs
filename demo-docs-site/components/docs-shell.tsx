import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SearchBox } from "@/components/search-box";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
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
      <header className="topbar">
        <Link className="brand-lockup" href={buildLanguageHref("/", language)}>
          <span className="brand-badge">OC</span>
          <div className="brand-copy">
            <strong>{navigation.site.title}</strong>
            <p className="topbar-copy">{navigation.site.tagline}</p>
          </div>
        </Link>
        <div className="topbar-actions">
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
      <div className="docs-body">
        <Sidebar currentSlug={currentSlug} language={language} navigation={navigation} />
        <main className="doc-main">{children}</main>
      </div>
    </div>
  );
}
