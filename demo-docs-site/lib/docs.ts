import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { DEFAULT_LANGUAGE, type Language } from "@/lib/i18n";

export type NavItem = {
  title: string;
  slug: string;
  description: string;
  order: number;
};

export type NavSection = {
  id: string;
  title: string;
  description: string;
  items: NavItem[];
};

export type SiteNavigation = {
  site: {
    title: string;
    description: string;
    tagline: string;
  };
  sections: NavSection[];
};

export type DocRecord = {
  slug: string;
  title: string;
  description: string;
  order: number;
  sectionId: string;
  sectionTitle: string;
  content: string;
};

export type SearchEntry = {
  title: string;
  description: string;
  slug: string;
  sectionTitle: string;
  excerpt: string;
};

const CONTENT_ROOT = path.join(process.cwd(), "content");

function getDocsRoot(language: Language) {
  return path.join(CONTENT_ROOT, language === "zh" ? "docs-zh" : "docs");
}

function getNavigationPath(language: Language) {
  return path.join(CONTENT_ROOT, language === "zh" ? "navigation.zh.json" : "navigation.json");
}

function humanize(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stripMarkdown(source: string) {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[>#*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function walkDocs(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walkDocs(fullPath);
    }

    return entry.name.endsWith(".mdx") ? [fullPath] : [];
  });
}

function getNavigationSlugSet(navigation: SiteNavigation) {
  return new Set(navigation.sections.flatMap((section) => section.items.map((item) => item.slug)));
}

export function getNavigation(language: Language = DEFAULT_LANGUAGE): SiteNavigation {
  const raw = fs.readFileSync(getNavigationPath(language), "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as SiteNavigation;
}

function parseDoc(filePath: string, navigation: SiteNavigation, docsRoot: string): DocRecord {
  const source = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(source);
  const slug = path.relative(docsRoot, filePath).replace(/\\/g, "/").replace(/\.mdx$/, "");
  const sectionId = slug.split("/")[0] ?? "guide";
  const section = navigation.sections.find((item) => item.id === sectionId);
  const fallbackTitle = humanize(path.basename(filePath, ".mdx"));

  return {
    slug,
    title: String(data.title ?? fallbackTitle),
    description: String(data.description ?? ""),
    order: Number(data.order ?? 999),
    sectionId,
    sectionTitle: section?.title?.trim() ? section.title : "",
    content,
  };
}

export function listDocRecords(language: Language = DEFAULT_LANGUAGE, navigationOnly = false): DocRecord[] {
  const navigation = getNavigation(language);
  const docsRoot = getDocsRoot(language);
  const navigationSlugs = navigationOnly ? getNavigationSlugSet(navigation) : null;

  return walkDocs(docsRoot)
    .sort()
    .map((filePath) => parseDoc(filePath, navigation, docsRoot))
    .filter((record) => (navigationSlugs ? navigationSlugs.has(record.slug) : true))
    .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
}

export function listStaticSlugs(): string[][] {
  const languages: Language[] = [DEFAULT_LANGUAGE, "zh"];
  const seen = new Set<string>();

  return languages
    .flatMap((language) => listDocRecords(language, true))
    .filter((record) => {
      if (seen.has(record.slug)) {
        return false;
      }
      seen.add(record.slug);
      return true;
    })
    .map((record) => record.slug.split("/"));
}

export function getLandingPageSlug(language: Language = DEFAULT_LANGUAGE): string[] {
  const navigation = getNavigation(language);
  const slug = navigation.sections[0]?.items[0]?.slug ?? "guide/openclaw-quick-understanding";
  return slug.split("/");
}

export function getDocBySlug(slugParts: string[], language: Language = DEFAULT_LANGUAGE): DocRecord | null {
  const navigation = getNavigation(language);
  const docsRoot = getDocsRoot(language);
  const slug = slugParts.join("/");
  const filePath = path.join(docsRoot, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return parseDoc(filePath, navigation, docsRoot);
}

export function getSearchEntries(language: Language = DEFAULT_LANGUAGE): SearchEntry[] {
  return listDocRecords(language, true).map((record) => ({
    title: record.title,
    description: record.description,
    slug: record.slug,
    sectionTitle: record.sectionTitle,
    excerpt: stripMarkdown(record.content).slice(0, 220),
  }));
}