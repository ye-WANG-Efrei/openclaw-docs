import Link from "next/link";
import { buildLanguageHref, getDictionary, type Language } from "@/lib/i18n";

export function LanguageSwitcher({
  currentLanguage,
  pathname,
}: {
  currentLanguage: Language;
  pathname: string;
}) {
  const labels = getDictionary(currentLanguage);

  return (
    <div aria-label={labels.languageSwitchLabel} className="language-switcher" role="navigation">
      {(["zh", "en"] as const).map((language) => {
        const active = language === currentLanguage;
        const label = language === "zh" ? labels.chineseShort : labels.englishShort;
        return (
          <Link
            className={active ? "language-pill active" : "language-pill"}
            href={buildLanguageHref(pathname, language)}
            key={language}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
