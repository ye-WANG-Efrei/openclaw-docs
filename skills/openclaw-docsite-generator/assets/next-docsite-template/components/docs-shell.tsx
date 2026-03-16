import type { ReactNode } from "react";
import { SearchBox } from "@/components/search-box";
import { Sidebar } from "@/components/sidebar";
import type { SearchEntry, SiteNavigation } from "@/lib/docs";

export function DocsShell({
  children,
  currentSlug,
  navigation,
  searchEntries,
}: {
  children: ReactNode;
  currentSlug: string;
  navigation: SiteNavigation;
  searchEntries: SearchEntry[];
}) {
  return (
    <div className="docs-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{navigation.site.title}</p>
          <p className="topbar-copy">{navigation.site.tagline}</p>
        </div>
        <SearchBox entries={searchEntries} />
      </header>
      <div className="docs-body">
        <Sidebar currentSlug={currentSlug} navigation={navigation} />
        <main className="doc-main">{children}</main>
      </div>
    </div>
  );
}
