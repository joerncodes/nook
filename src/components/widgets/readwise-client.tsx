"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReadwiseHighlight } from "@/lib/readwise";

type Props = {
  reviewId: number;
  reviewUrl: string;
  highlights: ReadwiseHighlight[];
  showImage?: boolean;
  hideWhenDone?: boolean;
};

type Progress = { index: number; completed: boolean };

function storageKey(reviewId: number) {
  return `nook:readwise:${reviewId}`;
}

function loadProgress(reviewId: number): Progress {
  if (typeof window === "undefined") return { index: 0, completed: false };
  try {
    const raw = window.localStorage.getItem(storageKey(reviewId));
    if (!raw) return { index: 0, completed: false };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      index: typeof parsed.index === "number" ? parsed.index : 0,
      completed: Boolean(parsed.completed),
    };
  } catch {
    return { index: 0, completed: false };
  }
}

function saveProgress(reviewId: number, p: Progress) {
  try {
    window.localStorage.setItem(storageKey(reviewId), JSON.stringify(p));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function ReadwiseClient({
  reviewId,
  reviewUrl,
  highlights,
  showImage = false,
  hideWhenDone = false,
}: Props) {
  const total = highlights.length;
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgress] = useState<Progress>({
    index: 0,
    completed: false,
  });

  useEffect(() => {
    const p = loadProgress(reviewId);
    setProgress({
      index: Math.min(p.index, Math.max(0, total - 1)),
      completed: p.completed && total > 0,
    });
    setHydrated(true);
  }, [reviewId, total]);

  const current = useMemo(
    () => highlights[progress.index],
    [highlights, progress.index],
  );

  const persist = useCallback(
    (next: Progress) => {
      setProgress(next);
      saveProgress(reviewId, next);
    },
    [reviewId],
  );

  const next = useCallback(() => {
    setProgress((p) => {
      const np =
        p.index < total - 1
          ? { ...p, index: p.index + 1 }
          : { ...p, completed: true };
      saveProgress(reviewId, np);
      return np;
    });
  }, [reviewId, total]);

  const prev = useCallback(() => {
    setProgress((p) => {
      if (p.completed) {
        const np = { index: total - 1, completed: false };
        saveProgress(reviewId, np);
        return np;
      }
      if (p.index > 0) {
        const np = { ...p, index: p.index - 1 };
        saveProgress(reviewId, np);
        return np;
      }
      return p;
    });
  }, [reviewId, total]);

  const restart = useCallback(() => {
    persist({ index: 0, completed: false });
  }, [persist]);

  useEffect(() => {
    if (!hydrated || total === 0) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hydrated, total, next, prev]);

  if (total === 0) {
    return (
      <article className="readwise" data-state="empty">
        <p className="readwise-empty">No highlights in today’s review.</p>
      </article>
    );
  }

  if (!hydrated) {
    return (
      <article className="readwise" data-state="loading">
        <div className="readwise-skeleton" aria-hidden />
      </article>
    );
  }

  if (progress.completed) {
    if (hideWhenDone) {
      return <article className="readwise readwise-hidden" aria-hidden />;
    }
    return (
      <article className="readwise" data-state="done">
        <p className="readwise-done-line">Done — see you tomorrow.</p>
        <p className="readwise-done-count">
          You worked through all {total} highlights.
        </p>
        <nav className="readwise-nav" aria-label="readwise actions">
          <button
            type="button"
            className="readwise-action"
            data-action="restart"
            onClick={restart}
          >
            Restart
          </button>
          <a
            className="readwise-action"
            data-action="open"
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Readwise
          </a>
        </nav>
      </article>
    );
  }

  const tags = current.tags?.map((t) => t.name).filter(Boolean) ?? [];
  const text = current.text ?? "";
  const firstChar = text.slice(0, 1);
  const rest = text.slice(1);
  const isLast = progress.index === total - 1;
  const pct = total > 1 ? progress.index / (total - 1) : 1;
  const coverSrc = showImage ? current.image_url : undefined;

  return (
    <article
      className="readwise"
      data-state="reading"
      data-with-image={coverSrc ? "true" : undefined}
    >
      <header className="readwise-meta" aria-hidden>
        <span className="readwise-progress">
          <span className="readwise-progress-num">
            {pad2(progress.index + 1)}
          </span>
          <span className="readwise-progress-sep"> / </span>
          <span className="readwise-progress-total">{pad2(total)}</span>
        </span>
        <span
          className="readwise-progress-bar"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={progress.index + 1}
        >
          <span
            className="readwise-progress-fill"
            style={{ width: `${pct * 100}%` }}
          />
        </span>
        {tags.length > 0 && (
          <span className="readwise-tags">
            {tags.slice(0, 4).map((t) => (
              <span key={t} className="readwise-tag">
                {t}
              </span>
            ))}
          </span>
        )}
      </header>

      <div className="readwise-body">
        {coverSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="readwise-cover"
            src={coverSrc}
            alt=""
            loading="lazy"
          />
        )}
        <div className="readwise-text-col">
          <blockquote className="readwise-quote">
            <span className="readwise-dropcap" aria-hidden>
              {firstChar}
            </span>
            <span className="readwise-rest">{rest}</span>
          </blockquote>

          {(current.title || current.author) && (
            <footer className="readwise-source">
              {current.author && (
                <span className="readwise-author">{current.author}</span>
              )}
              {current.author && current.title && (
                <span className="readwise-source-sep">, </span>
              )}
              {current.title && (
                <span className="readwise-title">
                  <em>{current.title}</em>
                </span>
              )}
            </footer>
          )}
        </div>
      </div>

      <nav className="readwise-nav" aria-label="readwise navigation">
        <button
          type="button"
          className="readwise-action"
          data-action="prev"
          onClick={prev}
          disabled={progress.index === 0}
        >
          <span className="readwise-key" aria-hidden>
            ←
          </span>
          <span>prev</span>
        </button>
        <button
          type="button"
          className="readwise-action"
          data-action="next"
          onClick={next}
        >
          <span>{isLast ? "finish" : "next"}</span>
          <span className="readwise-key" aria-hidden>
            →
          </span>
        </button>
      </nav>
    </article>
  );
}
