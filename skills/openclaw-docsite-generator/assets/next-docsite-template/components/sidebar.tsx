import Link from "next/link";
import type { SiteNavigation } from "@/lib/docs";

export function Sidebar({
  currentSlug,
  navigation,
}: {
  currentSlug: string;
  navigation: SiteNavigation;
}) {
  return (
    <aside className="sidebar">
      {navigation.sections.map((section) => (
        <section className="sidebar-section" key={section.id}>
          <div className="sidebar-heading">{section.title}</div>
          <p className="sidebar-copy">{section.description}</p>
          <nav>
            {section.items.map((item) => {
              const active = item.slug === currentSlug;
              return (
                <Link
                  className={active ? "sidebar-link active" : "sidebar-link"}
                  href={`/docs/${item.slug}`}
                  key={item.slug}
                >
                  <span>{item.title}</span>
                  <small>{item.description}</small>
                </Link>
              );
            })}
          </nav>
        </section>
      ))}
    </aside>
  );
}
