export const SUPPORTED_LANGUAGES = ["en", "zh"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

export type UiDictionary = {
  heroEyebrow: string;
  startReading: string;
  openSectionPrefix: string;
  searchPlaceholder: string;
  docSearchAria: string;
  languageSwitchLabel: string;
  englishShort: string;
  chineseShort: string;
  readFeaturedGuide: string;
  featuredGuideLabel: string;
  guideOutlineLabel: string;
  sectionsLabel: string;
  pagesLabel: string;
  coverageLabel: string;
};

const dictionaries: Record<Language, UiDictionary> = {
  en: {
    heroEyebrow: "OpenClaw Documentation",
    startReading: "Browse Docs",
    openSectionPrefix: "Open",
    searchPlaceholder: "Search docs, guides, and best practices",
    docSearchAria: "Search docs",
    languageSwitchLabel: "Language",
    englishShort: "EN",
    chineseShort: "中",
    readFeaturedGuide: "Read the Beginner Guide",
    featuredGuideLabel: "Start Here",
    guideOutlineLabel: "Documentation outline",
    sectionsLabel: "sections",
    pagesLabel: "pages",
    coverageLabel: "Coverage",
  },
  zh: {
    heroEyebrow: "OpenClaw 文档",
    startReading: "浏览文档",
    openSectionPrefix: "浏览",
    searchPlaceholder: "搜索文档、指南与最佳实践",
    docSearchAria: "搜索文档",
    languageSwitchLabel: "语言",
    englishShort: "EN",
    chineseShort: "中",
    readFeaturedGuide: "先读新手指南",
    featuredGuideLabel: "推荐先读",
    guideOutlineLabel: "文档总览",
    sectionsLabel: "个章节",
    pagesLabel: "页",
    coverageLabel: "覆盖范围",
  },
};

export function resolveLanguage(value: string | string[] | undefined | null): Language {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "zh" ? "zh" : DEFAULT_LANGUAGE;
}

export function getDictionary(language: Language): UiDictionary {
  return dictionaries[language];
}

/**
 * 中文：/  /docs/...
 * 英文：/en  /en/docs/...
 */
export function buildLanguageHref(pathname: string, language: Language): string {
  if (language === "en") {
    // / → /en,  /docs/x → /en/docs/x
    return pathname === "/" ? "/en" : `/en${pathname}`;
  }
  // zh: strip /en prefix if present
  return pathname.startsWith("/en") ? pathname.slice(3) || "/" : pathname;
}