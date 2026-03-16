"use client";

import Link from "next/link";
import { useState } from "react";
import type { SearchEntry } from "@/lib/docs";

export function SearchBox({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState("");

  const normalized = query.trim().toLowerCase();
  const results = normalized.length < 2
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
        aria-label="Search docs"
        className="search-input"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search docs, guides, and best practices"
        value={query}
      />
      {results.length > 0 ? (
        <div className="search-results">
          {results.map((result) => (
            <Link className="search-result" href={`/docs/${result.slug}`} key={result.slug}>
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
