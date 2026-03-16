"use client";

import Link from "next/link";
import { useState } from "react";
import type { SearchEntry } from "@/lib/docs";
import type { Language } from "@/lib/i18n";

export function SearchBox({
  entries,
  language,
  placeholder,
  ariaLabel,
}: {
  entries: SearchEntry[];
  language: Language;
  placeholder: string;
  ariaLabel: string;
}) {
  const [query, setQuery] = useState("");

  const normalized = query.trim().toLowerCase();
  const results =
    normalized.length < 2
      ? []
      : entries
          .filter((entry) => {
            const haystack = `${entry.title} ${entry.description} ${entry.sectionTitle} ${entry.excerpt}`.toLowerCase();
            return haystack.includes(normalized);
          })
          .slice(0, 8);

  return (
    <div className="search-box">
      <input
        aria-label={ariaLabel}
        className="search-input"
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        value={query}
      />
      {results.length > 0 ? (
        <div className="search-results">
          {results.map((result) => (
            <Link className="search-result" href={`/docs/${result.slug}?lang=${language}`} key={result.slug}>
              <strong>{result.title}</strong>
              <span>{result.sectionTitle}</span>
              <p>{result.description}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
