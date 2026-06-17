"use client";

import { useState } from "react";

type Engine = "duckduckgo" | "google" | "kagi" | "brave" | "startpage";

type Props = {
  engine?: Engine;
  placeholder?: string;
};

const ENGINES: Record<Engine, string> = {
  duckduckgo: "https://duckduckgo.com/?q=",
  google: "https://www.google.com/search?q=",
  kagi: "https://kagi.com/search?q=",
  brave: "https://search.brave.com/search?q=",
  startpage: "https://www.startpage.com/do/search?q=",
};

export function SearchWidget({
  engine = "duckduckgo",
  placeholder = "Search…",
}: Props) {
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    window.location.href = ENGINES[engine] + encodeURIComponent(trimmed);
  }

  return (
    <form onSubmit={submit} className="w-full">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-card px-6 py-4 text-lg shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
        type="text"
        autoComplete="off"
        spellCheck={false}
      />
    </form>
  );
}
