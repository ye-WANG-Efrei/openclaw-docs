import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DocsShell } from "@/components/docs-shell";
import {
  getDocBySlug,
  getLandingPageSlug,
  getNavigation,
  getSearchEntries,
  listStaticSlugs,
} from "@/lib/docs";
import { getDictionary } from "@/lib/i18n";

const DEFAULT_LANG = "zh" as const;

export function generateStaticParams() {
  return listStaticSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const language = DEFAULT_LANG;
  const navigation = getNavigation(language);
  const slug = resolvedParams.slug?.length ? resolvedParams.slug : getLandingPageSlug(language);
  const doc = getDocBySlug(slug, language);

  if (!doc) {
    return { title: `${navigation.site.title}` };
  }

  return {
    title: `${doc.title} | ${navigation.site.title}`,
    description: doc.description,
  };
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const language = DEFAULT_LANG;
  const labels = getDictionary(language);
  const slug = resolvedParams.slug?.length ? resolvedParams.slug : getLandingPageSlug(language);
  const doc = getDocBySlug(slug, language);

  if (!doc) {
    notFound();
  }

  const navigation = getNavigation(language);
  const searchEntries = getSearchEntries(language);

  return (
    <DocsShell
      currentPath={`/docs/${doc.slug}`}
      currentSlug={doc.slug}
      labels={labels}
      language={language}
      navigation={navigation}
      searchEntries={searchEntries}
    >
      <article className="doc-article">
        <header className="doc-header">
          {doc.sectionTitle ? <p className="eyebrow">{doc.sectionTitle}</p> : null}
          <h1>{doc.title}</h1>
          {doc.description ? <p className="doc-description">{doc.description}</p> : null}
        </header>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
      </article>
    </DocsShell>
  );
}
