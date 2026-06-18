import { loadConfig } from "@/lib/config";
import { WidgetRenderer } from "@/components/widgets/widget";
import { AtriumDayBar } from "@/components/atrium-day-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import type { DashboardConfig, Theme } from "@/lib/config";

export const dynamic = "force-dynamic";

const PHASES = ["morning", "midday", "dusk", "night"] as const;
type Phase = (typeof PHASES)[number];

function hourPhase(hour: number): Phase {
  if (hour >= 5 && hour < 9) return "morning";
  if (hour >= 9 && hour < 18) return "midday";
  if (hour >= 18 && hour < 23) return "dusk";
  return "night";
}

function splitColumns(columns: DashboardConfig["columns"]) {
  const n = columns.length;
  if (n === 0) return { left: [], right: [] };
  const leftCount = Math.floor(n / 2);
  return {
    left: columns.slice(0, leftCount),
    right: columns.slice(leftCount),
  };
}

function SideGroup({ columns }: { columns: DashboardConfig["columns"] }) {
  if (columns.length === 0) return null;
  return (
    <div
      className="grid gap-10"
      style={{
        gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
      }}
    >
      {columns.map((col, ci) => (
        <div key={`col-${ci}`} className="flex flex-col gap-6">
          {col.widgets.map((w, wi) => (
            <WidgetRenderer key={`w-${ci}-${wi}`} widget={w} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default async function Home() {
  const config = await loadConfig();
  const theme: Theme = config.theme;
  const phase = hourPhase(new Date().getHours());

  const { left, right } = splitColumns(config.columns);

  const sideWidth = (count: number) => (count > 0 ? `${count * 23.4}rem` : "0fr");

  const themeGap =
    theme === "atrium" ? "gap-14" : theme === "marginalia" ? "gap-10" : "gap-6";
  const themeYPad = theme === "atrium" ? "py-20" : "py-12";

  return (
    <div
      data-theme={theme}
      data-phase={theme === "atrium" ? phase : undefined}
      className="min-h-dvh bg-background text-foreground font-sans relative"
    >
      {theme === "atrium" && <AtriumDayBar />}
      <ThemeToggle />

      <div
        className={`mx-auto grid min-h-dvh max-w-[140rem] ${themeGap} px-8 ${themeYPad}`}
        style={{
          gridTemplateColumns: `minmax(0, ${sideWidth(left.length)}) minmax(0, 1fr) minmax(0, ${sideWidth(right.length)})`,
        }}
      >
        <aside className="min-w-0">
          <SideGroup columns={left} />
        </aside>

        <main
          className={`flex min-w-0 flex-col items-center justify-center ${themeGap}`}
        >
          <div className="flex w-full flex-col items-stretch gap-8">
            {config.center.map((w, i) => (
              <div
                key={`center-${i}`}
                className="center-widget mx-auto w-full"
                data-widget={w.type}
              >
                <WidgetRenderer widget={w} />
              </div>
            ))}
          </div>
        </main>

        <aside className="min-w-0">
          <SideGroup columns={right} />
        </aside>
      </div>
    </div>
  );
}
