import ICAL from "ical.js";

export type CalendarSource = {
  url: string;
  label?: string;
  color?: string;
};

export type CalendarEvent = {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  sourceLabel?: string;
  sourceColor?: string;
};

async function fetchIcs(url: string): Promise<string> {
  const httpUrl = url.replace(/^webcal:/i, "https:");
  const res = await fetch(httpUrl, {
    headers: { accept: "text/calendar, text/plain;q=0.9, */*;q=0.5" },
    next: { revalidate: 600, tags: ["calendar"] },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  const body = await res.text();
  if (!body.includes("BEGIN:VCALENDAR")) {
    throw new Error(
      "response is not an ICS feed (no BEGIN:VCALENDAR). " +
        "If this is a Google Calendar UI link (calendar.google.com/calendar/u/0?cid=…), " +
        "use the ICS export URL instead — Calendar settings → Integrate calendar → " +
        "“Secret address in iCal format” (or “Public address in iCal format” for shared calendars).",
    );
  }
  return body;
}

function registerTimezones(vcalendar: ICAL.Component): void {
  const tzComponents = vcalendar.getAllSubcomponents("vtimezone");
  for (const tz of tzComponents) {
    const tzid = tz.getFirstPropertyValue("tzid") as string | null;
    if (!tzid) continue;
    if (!ICAL.TimezoneService.has(tzid)) {
      ICAL.TimezoneService.register(tz);
    }
  }
}

function eventTitle(event: ICAL.Event): string {
  const summary = event.summary?.trim();
  return summary && summary.length > 0 ? summary : "(no title)";
}

function isAllDay(event: ICAL.Event): boolean {
  return Boolean(event.startDate?.isDate);
}

function expandEvents(
  vcalendar: ICAL.Component,
  windowStart: Date,
  windowEnd: Date,
  source: CalendarSource,
): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const vevents = vcalendar.getAllSubcomponents("vevent");

  for (const ve of vevents) {
    let event: ICAL.Event;
    try {
      event = new ICAL.Event(ve);
    } catch {
      continue;
    }

    const title = eventTitle(event);
    const location = (event.location as string | undefined)?.trim() || undefined;
    const allDay = isAllDay(event);

    if (event.isRecurring()) {
      const iter = event.iterator();
      let nextTime: ICAL.Time | null = iter.next();
      let safety = 0;
      while (nextTime && safety < 500) {
        safety++;
        const occStart = nextTime.toJSDate();
        if (occStart > windowEnd) break;
        const duration = event.duration.toSeconds() * 1000;
        const occEnd = new Date(occStart.getTime() + duration);
        if (occEnd >= windowStart && occStart <= windowEnd) {
          let details: { item?: ICAL.Event; startDate: ICAL.Time; endDate: ICAL.Time };
          try {
            details = event.getOccurrenceDetails(nextTime);
          } catch {
            nextTime = iter.next();
            continue;
          }
          const item = details.item ?? event;
          out.push({
            uid: `${event.uid}@${occStart.getTime()}`,
            title: eventTitle(item),
            start: details.startDate.toJSDate(),
            end: details.endDate.toJSDate(),
            allDay,
            location:
              (item.location as string | undefined)?.trim() || location,
            sourceLabel: source.label,
            sourceColor: source.color,
          });
        }
        nextTime = iter.next();
      }
    } else {
      if (!event.startDate || !event.endDate) continue;
      const start = event.startDate.toJSDate();
      const end = event.endDate.toJSDate();
      if (end < windowStart || start > windowEnd) continue;
      out.push({
        uid: event.uid ?? `${title}@${start.getTime()}`,
        title,
        start,
        end,
        allDay,
        location,
        sourceLabel: source.label,
        sourceColor: source.color,
      });
    }
  }

  return out;
}

function dedupe(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Set<string>();
  const out: CalendarEvent[] = [];
  for (const e of events) {
    const key = `${e.uid}|${e.start.getTime()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

export async function fetchCalendarEvents(opts: {
  sources: CalendarSource[];
  days: number;
  limit: number;
  showAllDay: boolean;
  now?: Date;
}): Promise<CalendarEvent[]> {
  const now = opts.now ?? new Date();
  // `days` is calendar days, not a 24h window: days=1 → today only,
  // days=2 → today + tomorrow, etc. End of the window is the last
  // millisecond of the Nth day from today.
  const todayStart = startOfDay(now);
  const windowEnd = new Date(
    todayStart.getTime() + opts.days * 24 * 60 * 60 * 1000 - 1,
  );

  const perSource = await Promise.all(
    opts.sources.map(async (source) => {
      try {
        const text = await fetchIcs(source.url);
        const jcal = ICAL.parse(text);
        const vcalendar = new ICAL.Component(jcal);
        registerTimezones(vcalendar);
        return expandEvents(vcalendar, now, windowEnd, source);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "fetch failed";
        throw new Error(`${source.label ?? source.url}: ${msg}`);
      }
    }),
  );

  const all = perSource.flat();
  const filtered = opts.showAllDay ? all : all.filter((e) => !e.allDay);
  const future = filtered.filter((e) => e.end >= now);
  future.sort((a, b) => a.start.getTime() - b.start.getTime());
  return dedupe(future).slice(0, opts.limit);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export type DayGroup = {
  date: Date;
  label: string;
  events: CalendarEvent[];
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function groupByDay(
  events: CalendarEvent[],
  now: Date,
  opts: { relativeDays?: boolean } = {},
): DayGroup[] {
  const relativeDays = opts.relativeDays ?? true;
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const groups = new Map<string, DayGroup>();

  for (const ev of events) {
    const d = startOfDay(ev.start);
    const k = dayKey(d);
    if (!groups.has(k)) {
      const absolute = `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
      let label = absolute;
      if (relativeDays) {
        if (d.getTime() === today.getTime()) label = "Today";
        else if (d.getTime() === tomorrow.getTime()) label = "Tomorrow";
      }
      groups.set(k, { date: d, label, events: [] });
    }
    groups.get(k)!.events.push(ev);
  }

  return [...groups.values()].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

export type MonthCell = {
  date: Date | null;
  day: number | null;
  isToday: boolean;
  hasEvents: boolean;
};

export type MonthMatrix = {
  monthLabel: string;
  weekdays: string[];
  weeks: MonthCell[][];
};

const WEEKDAY_NAMES_MON = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const WEEKDAY_NAMES_SUN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function buildMonthMatrix(opts: {
  now: Date;
  events: CalendarEvent[];
  weekStart: "mon" | "sun";
}): MonthMatrix {
  const { now, events, weekStart } = opts;
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = startOfDay(now);
  const todayKey = dayKey(today);

  const eventDays = new Set<string>();
  for (const ev of events) {
    eventDays.add(dayKey(startOfDay(ev.start)));
  }

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const offset =
    weekStart === "mon"
      ? (first.getDay() + 6) % 7 // 0=Mon..6=Sun
      : first.getDay(); // 0=Sun..6=Sat

  const cells: MonthCell[] = [];
  for (let i = 0; i < offset; i++) {
    cells.push({ date: null, day: null, isToday: false, hasEvents: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const k = dayKey(date);
    cells.push({
      date,
      day: d,
      isToday: k === todayKey,
      hasEvents: eventDays.has(k),
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, day: null, isToday: false, hasEvents: false });
  }

  const weeks: MonthCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return {
    monthLabel: `${MONTH_NAMES_FULL[month]} ${year}`,
    weekdays: weekStart === "mon" ? WEEKDAY_NAMES_MON : WEEKDAY_NAMES_SUN,
    weeks,
  };
}

export function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return "all-day";
  const start = event.start;
  const end = event.end;
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (!sameDay) return `${fmt(start)} →`;
  if (end.getTime() - start.getTime() <= 0) return fmt(start);
  return `${fmt(start)}–${fmt(end)}`;
}
