import { fetchWeather, type WeatherCondition, type WeatherUnits } from "@/lib/weather";

type Props = {
  lat: number;
  lon: number;
  label?: string;
  units: WeatherUnits;
  days: number;
};

const ICON: Record<WeatherCondition, string> = {
  clear: "sun",
  "partly-cloudy": "cloud-sun",
  cloudy: "cloud",
  fog: "cloud-fog",
  drizzle: "cloud-drizzle",
  rain: "cloud-rain",
  snow: "cloud-snow",
  thunderstorm: "cloud-bolt",
};

function WeatherIcon({
  condition,
  size = "md",
}: {
  condition: WeatherCondition;
  size?: "md" | "lg";
}) {
  return (
    <span
      aria-hidden
      className={`weather-icon weather-icon-${size}`}
      data-icon={ICON[condition]}
    />
  );
}

function dayName(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

function WeatherDayRange({
  current,
  min,
  max,
  unit,
}: {
  current: number;
  min?: number;
  max?: number;
  unit: string;
}) {
  if (typeof min !== "number" || typeof max !== "number" || max <= min) {
    if (typeof max === "number") {
      return (
        <div className="weather-high">
          high of {max}
          {unit}
        </div>
      );
    }
    return null;
  }
  const ratio = Math.min(1, Math.max(0, (current - min) / (max - min)));
  return (
    <div className="weather-range" aria-label={`Current ${current}${unit}, today's range ${min}${unit} to ${max}${unit}`}>
      <span className="weather-range-end weather-range-low">
        {min}
        {unit}
      </span>
      <span
        className="weather-range-track"
        role="progressbar"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
      >
        <span
          className="weather-range-fill"
          style={{ width: `${ratio * 100}%` }}
        />
        <span
          className="weather-range-marker"
          style={{ left: `${ratio * 100}%` }}
          aria-hidden="true"
        />
      </span>
      <span className="weather-range-end weather-range-high">
        {max}
        {unit}
      </span>
    </div>
  );
}

export async function WeatherWidget({ lat, lon, label, units, days }: Props) {
  let snap;
  try {
    snap = await fetchWeather({ lat, lon, units, days });
  } catch (e) {
    return (
      <div className="weather-empty">
        Couldn&apos;t load weather: {e instanceof Error ? e.message : "unknown error"}
      </div>
    );
  }

  return (
    <div className="weather">
      <div className="weather-current">
        <WeatherIcon condition={snap.current.condition} size="lg" />
        <div className="weather-current-text">
          <div className="weather-temp">
            <span className="weather-temp-num">{snap.current.temperature}</span>
            <span className="weather-temp-unit">{snap.units.temp}</span>
          </div>
          <div className="weather-meta">
            {label && <span className="weather-label">{label}</span>}
            {label && <span className="weather-meta-sep">·</span>}
            <span className="weather-condition">{snap.current.label}</span>
          </div>
          <WeatherDayRange
            current={snap.current.temperature}
            min={snap.current.todayMin}
            max={snap.current.todayMax}
            unit={snap.units.temp}
          />
        </div>
      </div>

      {snap.daily.length > 0 && (
        <ul className="weather-forecast">
          {snap.daily.map((d) => (
            <li key={d.date} className="weather-day" title={d.label}>
              <span className="weather-day-name">{dayName(d.date)}</span>
              <WeatherIcon condition={d.condition} size="md" />
              <span className="weather-day-temps">
                <span className="weather-day-max">{d.max}°</span>
                <span className="weather-day-min">{d.min}°</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
