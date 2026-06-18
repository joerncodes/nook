export type KimaiProjectTotal = {
  projectId: number;
  name: string;
  customer?: string;
  seconds: number;
};

export type KimaiDay = {
  /** Local `YYYY-MM-DD`. */
  date: string;
  /** Short weekday label, e.g. `Mon`. */
  label: string;
  isToday: boolean;
  totalSeconds: number;
  /** Seconds per project id for this day. */
  byProject: Map<number, number>;
};

export type KimaiWeek = {
  /** All projects with time this week, sorted by seconds descending. */
  projects: KimaiProjectTotal[];
  /** Sum across every project, not just the rendered top N. */
  totalSeconds: number;
  /** Seven entries, ordered from `weekStart` weekday. */
  days: KimaiDay[];
  /** Local ISO datetime the window starts at (for aria/debug). */
  begin: string;
};

export type KimaiWeekStart = "monday" | "sunday";

// The timesheet collection returns project/activity as bare ids and duration
// in seconds; running entries have null duration (compute it from `begin`).
type RawTimesheet = {
  duration: number | null;
  project: number;
  begin: string;
  end: string | null;
};

// Project collection rows: `parentTitle` carries the customer name.
type RawProject = {
  id: number;
  name: string;
  parentTitle?: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** HTML5 local datetime (`YYYY-MM-DDTHH:mm:ss`) — the format Kimai expects. */
function formatLocal(d: Date): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/** Local calendar day (`YYYY-MM-DD`), used to bucket entries by weekday. */
function localDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Start of the current week at 00:00 local time. The container's TZ env
 * (e.g. Europe/Berlin) makes Node's local time the user's wall clock, so
 * plain Date math lands on the right day.
 */
function weekStart(mode: KimaiWeekStart): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday … 6 = Saturday
  const back = mode === "monday" ? (day === 0 ? 6 : day - 1) : day;
  d.setDate(d.getDate() - back);
  return d;
}

/** Format seconds as `4h 20m` / `45m` / `2h`. */
export function formatHm(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

async function fetchAllPages<T>(
  baseUrl: string,
  path: string,
  token: string,
  params: Record<string, string>,
  tag: string,
): Promise<T[]> {
  const base = baseUrl.replace(/\/$/, "");
  const out: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = new URL(`${base}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("size", "500");
    url.searchParams.set("page", String(page));
    const res = await fetch(url.toString(), {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      next: { revalidate: 300, tags: [tag] },
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    out.push(...((await res.json()) as T[]));
    totalPages = Number(res.headers.get("X-Total-Pages") ?? "1") || 1;
    page++;
  } while (page <= totalPages);
  return out;
}

export async function fetchKimaiWeek(opts: {
  baseUrl: string;
  token: string;
  weekStart: KimaiWeekStart;
}): Promise<KimaiWeek> {
  const start = weekStart(opts.weekStart);
  const begin = formatLocal(start);
  const end = formatLocal(new Date());

  const [sheets, projects] = await Promise.all([
    fetchAllPages<RawTimesheet>(
      opts.baseUrl,
      "/api/timesheets",
      opts.token,
      { begin, end },
      "kimai-timesheets",
    ),
    fetchAllPages<RawProject>(
      opts.baseUrl,
      "/api/projects",
      opts.token,
      {},
      "kimai-projects",
    ),
  ]);

  const names = new Map(projects.map((p) => [p.id, p]));
  const totals = new Map<number, number>();
  const now = Date.now();

  // Seven-day skeleton, ordered from the week start, with a date → index map
  // so each timesheet can be dropped into the day it begins on.
  const todayStr = localDate(new Date());
  const days: KimaiDay[] = [];
  const dayIndex = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = localDate(d);
    dayIndex.set(date, i);
    days.push({
      date,
      label: d.toLocaleDateString("en-GB", { weekday: "short" }),
      isToday: date === todayStr,
      totalSeconds: 0,
      byProject: new Map(),
    });
  }

  for (const t of sheets) {
    let secs = t.duration;
    if (secs == null) {
      // Running entry — duration accrues from begin until now.
      const startMs = Date.parse(t.begin);
      secs = Number.isFinite(startMs)
        ? Math.max(0, Math.round((now - startMs) / 1000))
        : 0;
    }
    totals.set(t.project, (totals.get(t.project) ?? 0) + secs);

    // Attribute the whole entry to the day it begins on (matches the
    // project totals, which also count each entry once).
    const di = dayIndex.get(localDate(new Date(t.begin)));
    if (di !== undefined) {
      const day = days[di];
      day.totalSeconds += secs;
      day.byProject.set(t.project, (day.byProject.get(t.project) ?? 0) + secs);
    }
  }

  const projectTotals: KimaiProjectTotal[] = [...totals.entries()]
    .map(([projectId, seconds]) => {
      const p = names.get(projectId);
      return {
        projectId,
        name: p?.name ?? `Project #${projectId}`,
        customer: p?.parentTitle || undefined,
        seconds,
      };
    })
    .sort((a, b) => b.seconds - a.seconds);

  const totalSeconds = projectTotals.reduce((s, p) => s + p.seconds, 0);
  return { projects: projectTotals, totalSeconds, days, begin };
}
