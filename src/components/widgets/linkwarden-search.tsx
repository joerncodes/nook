"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LinkwardenItem = {
  id: number;
  name: string;
  url: string;
  host: string;
  collectionColor?: string;
  collectionName?: string;
};

type Props = {
  recent: LinkwardenItem[];
  placeholder: string;
  showSearch: boolean;
};

function isTypingInOther(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

function ItemRow({
  item,
  active,
  onMouseEnter,
}: {
  item: LinkwardenItem;
  active?: boolean;
  onMouseEnter?: () => void;
}) {
  return (
    <li
      className="linkwarden-result"
      data-active={active ? "true" : undefined}
      role="option"
      aria-selected={active ?? false}
    >
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={onMouseEnter}
        className="linkwarden-result-link"
        title={item.name}
      >
        <span
          className="linkwarden-dot"
          style={{
            backgroundColor:
              item.collectionColor ?? "var(--muted-foreground)",
          }}
          aria-hidden="true"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="linkwarden-favicon"
          src={`https://icons.duckduckgo.com/ip3/${item.host}.ico`}
          alt=""
          loading="lazy"
          width={16}
          height={16}
        />
        <span className="linkwarden-result-main">
          <span className="linkwarden-result-name">{item.name || item.url}</span>
          <span className="linkwarden-result-host">{item.host}</span>
        </span>
      </a>
    </li>
  );
}

export function LinkwardenSearch({ recent, placeholder, showSearch }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<LinkwardenItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (query: string) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/linkwarden/search?q=${encodeURIComponent(query)}`,
        { signal: ac.signal },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { results: LinkwardenItem[] };
      setResults(data.results ?? []);
      setHighlight(0);
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }
    debounceRef.current = window.setTimeout(() => runSearch(trimmed), 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q, runSearch]);

  useEffect(() => {
    if (!showSearch) return;
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !isTypingInOther(e.target) &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSearch]);

  const searching = q.trim().length >= 2;
  const items = searching ? results ?? [] : recent;
  const showEmptyResults =
    searching && !loading && !error && results !== null && results.length === 0;

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setQ("");
      inputRef.current?.blur();
      return;
    }
    if (items.length === 0) {
      if (e.key === "Enter") e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = items[highlight] ?? items[0];
      if (pick) window.open(pick.url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="linkwarden">
      {showSearch && (
        <div className="linkwarden-search">
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            className="linkwarden-search-input"
          />
        </div>
      )}

      {searching && loading && results === null && (
        <p className="linkwarden-status">Searching…</p>
      )}
      {searching && error && (
        <p className="linkwarden-status linkwarden-status-error">{error}</p>
      )}
      {showEmptyResults && <p className="linkwarden-status">no matches</p>}

      {items.length > 0 && (
        <ul className="linkwarden-results" role="listbox">
          {items.map((item, i) => (
            <ItemRow
              key={item.id}
              item={item}
              active={searching && i === highlight}
              onMouseEnter={searching ? () => setHighlight(i) : undefined}
            />
          ))}
        </ul>
      )}

      {!searching && recent.length === 0 && (
        <p className="widget-empty">No recent saves.</p>
      )}
    </div>
  );
}
