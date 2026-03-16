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

const LANG = "en" as const;

export function generateStaticParams() {
  // 英文只生成 en 语言的页面
  return listStaticSlugs()
    .filter((slug) => {
      // 只取英文文档对应的 slug
      const slugArr = Array.isArray(slug) ? slug : [slug];
      return true; // 所有 slug 都生成英文版
    })
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const navigation = getNavigation(LANG);
  const slug = resolvedParams.slug?.length ? resolvedParams.slug : getLandingPageSlug(LANG);
  const doc = getDocBySlug(slug, LANG);

  if (!doc) return { title: navigation.site.title };

  return {
    title: `${doc.title} | ${navigation.site.title}`,
    description: doc.description,
  };
}

export default async function DocsPageEn({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const language = LANG;
  const labels = getDictionary(language);
  const slug = resolvedParams.slug?.length ? resolvedParams.slug : getLandingPageSlug(language);
  const doc = getDocBySlug(slug, language);

  if (!doc) notFound();

  const navigation = getNavigation(language);
  const searchEntries = getSearchEntries(language);

  return (
    <DocsShell
      currentPath={`/en/docs/${doc.slug}`}
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
