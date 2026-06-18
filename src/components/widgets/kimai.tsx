import { fetchKimaiWeek, formatHm, type KimaiWeek, type KimaiWeekStart } from "@/lib/kimai";

type Props = {
  baseUrl: string;
  token: string;
  limit?: number;
  weekStart?: KimaiWeekStart;
};

// Categorical palette (earthy, legible on both the light and dark theme cards).
// Top-N projects take colors 1..N; everything else stacks as "other".
const PALETTE = 6;

function colorVar(rank: number): string {
  return rank < 0 ? "var(--kimai-cat-other)" : `var(--kimai-cat-${(rank % PALETTE) + 1})`;
}

export async function KimaiWidget({
  baseUrl,
  token,
  limit = 5,
  weekStart = "monday",
}: Props) {
  let week: KimaiWeek | null = null;
  let error: string | null = null;
  try {
    week = await fetchKimaiWeek({ baseUrl, token, weekStart });
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to fetch";
  }

  if (error) {
    return <div className="text-sm text-destructive">Kimai: {error}</div>;
  }

  const top = week!.projects.slice(0, limit);
  const moreCount = week!.projects.length - top.length;
  const rankOf = new Map(top.map((p, i) => [p.projectId, i]));
  // Scale every day's bar to the busiest day so column heights are comparable.
  const maxDay = Math.max(1, ...week!.days.map((d) => d.totalSeconds));

  if (top.length === 0) {
    return (
      <div className="kimai">
        <p className="widget-empty">No time tracked this week.</p>
      </div>
    );
  }

  return (
    <div className="kimai">
      <div className="kimai-chart" role="img" aria-label="Tracked time per weekday">
        {week!.days.map((d) => {
          // Top projects (in legend order) first, "other" last — with the
          // column reversed in CSS this puts the biggest project at the bottom
          // and the aggregated remainder on top.
          const segs = top
            .map((p) => ({ key: String(p.projectId), rank: rankOf.get(p.projectId)!, secs: d.byProject.get(p.projectId) ?? 0 }))
            .filter((s) => s.secs > 0);
          const otherSecs = [...d.byProject.entries()]
            .filter(([id]) => !rankOf.has(id))
            .reduce((sum, [, v]) => sum + v, 0);
          return (
            <div key={d.date} className="kimai-col" data-today={d.isToday || undefined}>
              <span
                className="kimai-col-bar"
                title={`${d.label}: ${formatHm(d.totalSeconds)}`}
              >
                {segs.map((s) => (
                  <span
                    key={s.key}
                    className="kimai-seg"
                    style={{ height: `${(s.secs / maxDay) * 100}%`, background: colorVar(s.rank) }}
                  />
                ))}
                {otherSecs > 0 && (
                  <span
                    className="kimai-seg"
                    style={{ height: `${(otherSecs / maxDay) * 100}%`, background: colorVar(-1) }}
                  />
                )}
              </span>
              <span className="kimai-col-label">{d.label}</span>
            </div>
          );
        })}
      </div>

      <ul className="kimai-list">
        {top.map((p, i) => (
          <li key={p.projectId} className="kimai-row">
            <span
              className="kimai-swatch"
              style={{ background: colorVar(i) }}
              aria-hidden="true"
            />
            <span className="kimai-project" title={p.customer ?? p.name}>
              {p.name}
            </span>
            <span className="kimai-duration">{formatHm(p.seconds)}</span>
          </li>
        ))}
      </ul>

      <dl className="kimai-footer">
        <div className="kimai-total">
          <dt className="kimai-total-label">This week</dt>
          <dd className="kimai-total-value">{formatHm(week!.totalSeconds)}</dd>
        </div>
        {moreCount > 0 && <span className="kimai-more">+{moreCount} more</span>}
      </dl>
    </div>
  );
}
