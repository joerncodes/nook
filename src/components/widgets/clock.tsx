"use client";

import { useEffect, useState } from "react";

type Props = {
  timezone?: string;
  format24h?: boolean;
  showDate?: boolean;
  showWeek?: boolean;
  words?: boolean;
};

function formatTime(d: Date, timezone: string | undefined, format24h: boolean) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !format24h,
    timeZone: timezone,
  });
}

function formatDateLong(d: Date, timezone: string | undefined) {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  });
}

function isoWeek(d: Date, timezone: string | undefined): number {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .split("-")
    .map(Number);
  const utc = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2]));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil((((+utc - +yearStart) / 86400000) + 1) / 7);
}

function formatDateShortCaps(d: Date, timezone: string | undefined) {
  return d
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: timezone,
    })
    .toUpperCase();
}

const HOUR_WORDS = [
  "twelve",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
];
const MIN_WORDS: Record<number, string> = {
  5: "five",
  10: "ten",
  15: "a quarter",
  20: "twenty",
  25: "twenty-five",
  30: "half",
};

function timeInWords(d: Date, timezone: string | undefined) {
  const local = timezone
    ? new Date(d.toLocaleString("en-US", { timeZone: timezone }))
    : d;
  const hours = local.getHours();
  const minsRaw = local.getMinutes();
  const minsRounded = Math.round(minsRaw / 5) * 5;
  const mins = minsRounded === 60 ? 0 : minsRounded;
  const hoursAdj = minsRounded === 60 ? hours + 1 : hours;

  const hour12 = hoursAdj % 12;
  if (mins === 0) {
    return `${HOUR_WORDS[hour12]} o'clock.`;
  }
  if (mins <= 30) {
    return `${MIN_WORDS[mins]} past ${HOUR_WORDS[hour12]}.`;
  }
  const nextHour12 = (hour12 + 1) % 12;
  return `${MIN_WORDS[60 - mins]} to ${HOUR_WORDS[nextHour12]}.`;
}

function WordsClock({
  now,
  timezone,
  format24h,
  showDate,
  showWeek,
}: {
  now: Date;
  timezone?: string;
  format24h: boolean;
  showDate: boolean;
  showWeek: boolean;
}) {
  const wk = showWeek ? `w${isoWeek(now, timezone)}` : null;
  return (
    <div className="flex flex-col items-center text-center" data-clock="words">
      <div
        className="font-clock text-[3.5rem] leading-[1.05] italic sm:text-6xl"
        style={{ fontWeight: 300 }}
      >
        {timeInWords(now, timezone)}
      </div>
      {(showDate || wk) && (
        <div className="mt-4 font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
          {showDate && (
            <>
              {formatTime(now, timezone, format24h)} ·{" "}
              {formatDateShortCaps(now, timezone).toLowerCase()}
            </>
          )}
          {showDate && wk && " · "}
          {wk}
        </div>
      )}
    </div>
  );
}

function DigitsClock({
  now,
  timezone,
  format24h,
  showDate,
  showWeek,
}: {
  now: Date;
  timezone?: string;
  format24h: boolean;
  showDate: boolean;
  showWeek: boolean;
}) {
  const wkNum = isoWeek(now, timezone);
  return (
    <>
      {/* QUARTZ */}
      <div
        className="hidden flex-col items-center text-center [[data-theme=quartz]_&]:flex"
        data-clock="quartz"
      >
        <div className="relative flex items-baseline gap-3">
          <div
            className="font-clock text-7xl font-extralight tracking-[-0.02em] tabular-nums sm:text-8xl"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatTime(now, timezone, format24h)}
          </div>
          <span
            aria-hidden
            className="quartz-tick inline-block h-12 w-[2px] self-stretch self-center"
            style={{ background: "var(--signal)" }}
          />
        </div>
        {(showDate || showWeek) && (
          <div className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {showDate && formatDateShortCaps(now, timezone)}
            {showDate && showWeek && " · "}
            {showWeek && `W${wkNum}`}
          </div>
        )}
      </div>

      {/* ATRIUM */}
      <div
        className="hidden flex-col items-center text-center [[data-theme=atrium]_&]:flex"
        data-clock="atrium-digits"
      >
        <div
          className="font-clock text-7xl italic leading-[0.95] tabular-nums sm:text-8xl"
          style={{ fontWeight: 300 }}
        >
          {formatTime(now, timezone, format24h)}
        </div>
        {(showDate || showWeek) && (
          <div className="mt-4 font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
            {showDate && formatDateShortCaps(now, timezone).toLowerCase()}
            {showDate && showWeek && " · "}
            {showWeek && `w${wkNum}`}
          </div>
        )}
      </div>

      {/* MARGINALIA */}
      <div
        className="hidden flex-col items-start text-left [[data-theme=marginalia]_&]:flex"
        data-clock="marginalia"
      >
        <div
          className="font-clock text-7xl font-light leading-[0.95] tracking-tight tabular-nums sm:text-8xl"
          style={{ color: "var(--foreground)" }}
        >
          {formatTime(now, timezone, format24h)}
        </div>
        {(showDate || showWeek) && (
          <div
            className="mt-3 text-[11px] tracking-[0.08em] text-muted-foreground"
            style={{
              fontVariantCaps: "all-small-caps",
              fontFeatureSettings: '"c2sc" 1, "smcp" 1',
            }}
          >
            {showDate && formatDateLong(now, timezone)}
            {showDate && showWeek && " · "}
            {showWeek && `week ${wkNum}`}
          </div>
        )}
      </div>
    </>
  );
}

export function ClockWidget({
  timezone,
  format24h = true,
  showDate = true,
  showWeek = false,
  words = false,
}: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    return (
      <div className="flex flex-col items-center">
        <div className="h-32 w-64 opacity-30">&nbsp;</div>
      </div>
    );
  }

  return words ? (
    <WordsClock
      now={now}
      timezone={timezone}
      format24h={format24h}
      showDate={showDate}
      showWeek={showWeek}
    />
  ) : (
    <DigitsClock
      now={now}
      timezone={timezone}
      format24h={format24h}
      showDate={showDate}
      showWeek={showWeek}
    />
  );
}
