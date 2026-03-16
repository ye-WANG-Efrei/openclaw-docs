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

export function generateStaticParams() {
  return listStaticSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug?: string[] };
}): Metadata {
  const slug = params.slug?.length ? params.slug : getLandingPageSlug();
  const doc = getDocBySlug(slug);

  if (!doc) {
    return {
      title: "Document Not Found | __DOCSITE_TITLE__",
    };
  }

  return {
    title: `${doc.title} | __DOCSITE_TITLE__`,
    description: doc.description,
  };
}

export default function DocsPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const slug = params.slug?.length ? params.slug : getLandingPageSlug();
  const doc = getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  const navigation = getNavigation();
  const searchEntries = getSearchEntries();

  return (
    <DocsShell currentSlug={doc.slug} navigation={navigation} searchEntries={searchEntries}>
      <article className="doc-article">
        <header className="doc-header">
          <p className="eyebrow">{doc.sectionTitle}</p>
          <h1>{doc.title}</h1>
          <p className="doc-description">{doc.description}</p>
        </header>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
      </article>
    </DocsShell>
  );
}
