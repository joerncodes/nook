"use client";

import { useEffect, useState } from "react";

function fractionOfDay(d: Date) {
  return (
    (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400
  );
}

export function AtriumDayBar() {
  const [frac, setFrac] = useState<number | null>(null);

  useEffect(() => {
    setFrac(fractionOfDay(new Date()));
    const id = setInterval(() => {
      setFrac(fractionOfDay(new Date()));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  if (frac === null) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 bottom-0 left-6 w-px"
      style={{ background: "var(--border)" }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 h-px w-2"
        style={{
          top: `${frac * 100}%`,
          background: "var(--signal)",
          transition: "top 1500ms ease",
        }}
      />
    </div>
  );
}
