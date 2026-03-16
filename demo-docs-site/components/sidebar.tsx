import Link from "next/link";
import type { SiteNavigation } from "@/lib/docs";
import { buildLanguageHref, type Language } from "@/lib/i18n";

export function Sidebar({
  currentSlug,
  language,
  navigation,
}: {
  currentSlug: string;
  language: Language;
  navigation: SiteNavigation;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-intro">
        <div className="sidebar-heading">{navigation.site.title}</div>
        <p className="sidebar-copy">{navigation.site.description}</p>
      </div>
      {navigation.sections.map((section) => {
        const showSectionMeta = Boolean(section.title.trim() || section.description.trim());
        return (
          <section className="sidebar-section" key={section.id}>
            {showSectionMeta ? (
              <>
                <div className="sidebar-heading">{section.title}</div>
                {section.description ? <p className="sidebar-copy">{section.description}</p> : null}
              </>
            ) : null}
            <nav>
              {section.items.map((item) => {
                const active = item.slug === currentSlug;
                return (
                  <Link
                    className={active ? "sidebar-link active" : "sidebar-link"}
                    href={buildLanguageHref(`/docs/${item.slug}`, language)}
                    key={item.slug}
                  >
                    <span>{item.title}</span>
                    {item.description ? <small>{item.description}</small> : null}
                  </Link>
                );
              })}
            </nav>
          </section>
        );
      })}
    </aside>
  );
}