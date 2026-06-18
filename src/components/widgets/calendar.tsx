import {
  buildMonthMatrix,
  fetchCalendarEvents,
  formatEventTime,
  groupByDay,
  type CalendarEvent,
  type CalendarSource,
  type MonthMatrix,
} from "@/lib/calendar";

type Props = {
  sources: CalendarSource[];
  limit: number;
  days: number;
  showAllDay: boolean;
  relativeDays: boolean;
  showMonth: boolean;
  weekStart: "mon" | "sun";
};

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <li className="calendar-event">
      <span
        className="calendar-event-dot"
        style={{
          backgroundColor: event.sourceColor ?? "var(--muted-foreground)",
        }}
        aria-hidden="true"
      />
      <span className="calendar-event-time">{formatEventTime(event)}</span>
      <span className="calendar-event-main">
        <span className="calendar-event-title">{event.title}</span>
        {event.location && (
          <span className="calendar-event-location">{event.location}</span>
        )}
      </span>
    </li>
  );
}

function MonthGrid({ matrix }: { matrix: MonthMatrix }) {
  return (
    <div className="calendar-month" aria-label={matrix.monthLabel}>
      <div className="calendar-month-header">
        <span className="calendar-month-label">{matrix.monthLabel}</span>
      </div>
      <div className="calendar-month-grid" role="grid">
        {matrix.weekdays.map((w) => (
          <span key={w} className="calendar-month-weekday" role="columnheader">
            {w}
          </span>
        ))}
        {matrix.weeks.map((week, wi) =>
          week.map((cell, ci) =>
            cell.day === null ? (
              <span
                key={`${wi}-${ci}-empty`}
                className="calendar-month-cell"
                data-empty="true"
                aria-hidden="true"
              />
            ) : (
              <span
                key={`${wi}-${ci}-${cell.day}`}
                className="calendar-month-cell"
                data-today={cell.isToday ? "true" : undefined}
                data-has-events={cell.hasEvents ? "true" : undefined}
                role="gridcell"
                aria-current={cell.isToday ? "date" : undefined}
              >
                <span className="calendar-month-num">{cell.day}</span>
              </span>
            ),
          ),
        )}
      </div>
    </div>
  );
}

export async function CalendarWidget({
  sources,
  limit,
  days,
  showAllDay,
  relativeDays,
  showMonth,
  weekStart,
}: Props) {
  let events: CalendarEvent[] = [];
  let error: string | null = null;
  try {
    events = await fetchCalendarEvents({
      sources,
      limit: showMonth ? Math.max(limit, 50) : limit,
      days,
      showAllDay,
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to fetch";
  }

  if (error) {
    return <div className="text-sm text-destructive">Calendar: {error}</div>;
  }

  const now = new Date();
  const matrix = showMonth
    ? buildMonthMatrix({ now, events, weekStart })
    : null;
  const visibleEvents = events.slice(0, limit);
  const groups = groupByDay(visibleEvents, now, { relativeDays });

  return (
    <div className="calendar">
      {matrix && <MonthGrid matrix={matrix} />}
      {visibleEvents.length === 0 ? (
        <p className="widget-empty">Nothing scheduled.</p>
      ) : (
        groups.map((group) => (
          <section key={group.label} className="calendar-day">
            <h3 className="calendar-day-label">{group.label}</h3>
            <ul className="calendar-events">
              {group.events.map((ev) => (
                <EventRow key={ev.uid} event={ev} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
