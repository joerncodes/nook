"use client";

import { useEffect, useState } from "react";

type Asset = {
  id: string;
  originalFileName?: string;
  width?: number;
  height?: number;
};

type Props = {
  baseUrl: string;
  assets: Asset[];
  intervalMs?: number;
};

function pad(n: number, width: number) {
  return String(n).padStart(width, "0");
}

export function ImmichCarousel({
  baseUrl,
  assets,
  intervalMs = 8000,
}: Props) {
  const total = assets.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || total < 2) return;
    const t = setInterval(() => {
      setI((prev) => (prev + 1) % total);
    }, intervalMs);
    return () => clearInterval(t);
  }, [total, paused, intervalMs]);

  const current = assets[i];
  const cleanBase = baseUrl.replace(/\/$/, "");
  const padW = String(total).length;
  const ratio =
    current.width && current.height
      ? `${current.width} / ${current.height}`
      : "3 / 2";

  return (
    <div
      className="immich-carousel"
      data-paused={paused ? "true" : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <a
        href={`${cleanBase}/photos/${current.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="immich-carousel-frame"
        title={current.originalFileName ?? ""}
        style={{ aspectRatio: ratio }}
      >
        {assets.map((a, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={a.id}
            src={`/api/immich/${a.id}/thumb`}
            alt=""
            className="immich-carousel-img"
            data-active={idx === i ? "true" : undefined}
            loading={idx === 0 ? "eager" : "lazy"}
          />
        ))}
      </a>
      <div className="immich-carousel-meta">
        <span className="immich-carousel-pos">
          {pad(i + 1, padW)} / {pad(total, padW)}
        </span>
        <button
          type="button"
          className="immich-carousel-next"
          aria-label="next photo"
          onClick={() => setI((p) => (p + 1) % total)}
        >
          →
        </button>
      </div>
    </div>
  );
}
