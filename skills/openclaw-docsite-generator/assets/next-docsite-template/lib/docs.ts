import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

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
const DOCS_ROOT = path.join(CONTENT_ROOT, "docs");
const NAVIGATION_PATH = path.join(CONTENT_ROOT, "navigation.json");

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
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walkDocs(fullPath);
    }

    return entry.name.endsWith(".mdx") ? [fullPath] : [];
  });
}

export function getNavigation(): SiteNavigation {
  return JSON.parse(fs.readFileSync(NAVIGATION_PATH, "utf8")) as SiteNavigation;
}

function parseDoc(filePath: string, navigation: SiteNavigation): DocRecord {
  const source = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(source);
  const slug = path.relative(DOCS_ROOT, filePath).replace(/\\/g, "/").replace(/\.mdx$/, "");
  const sectionId = slug.split("/")[0] ?? "beginner";
  const section = navigation.sections.find((item) => item.id === sectionId);
  const fallbackTitle = humanize(path.basename(filePath, ".mdx"));

  return {
    slug,
    title: String(data.title ?? fallbackTitle),
    description: String(data.description ?? ""),
    order: Number(data.order ?? 999),
    sectionId,
    sectionTitle: section?.title ?? humanize(sectionId),
    content,
  };
}

export function listDocRecords(): DocRecord[] {
  const navigation = getNavigation();
  return walkDocs(DOCS_ROOT)
    .sort()
    .map((filePath) => parseDoc(filePath, navigation))
    .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
}

export function listStaticSlugs(): string[][] {
  return listDocRecords().map((record) => record.slug.split("/"));
}

export function getLandingPageSlug(): string[] {
  const navigation = getNavigation();
  const slug = navigation.sections[0]?.items[0]?.slug ?? "beginner/introduction";
  return slug.split("/");
}

export function getDocBySlug(slugParts: string[]): DocRecord | null {
  const navigation = getNavigation();
  const slug = slugParts.join("/");
  const filePath = path.join(DOCS_ROOT, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return parseDoc(filePath, navigation);
}

export function getSearchEntries(): SearchEntry[] {
  return listDocRecords().map((record) => ({
    title: record.title,
    description: record.description,
    slug: record.slug,
    sectionTitle: record.sectionTitle,
    excerpt: stripMarkdown(record.content).slice(0, 220),
  }));
}
