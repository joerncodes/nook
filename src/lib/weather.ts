export type WeatherUnits = "metric" | "imperial";

export type WeatherCondition =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm";

export type WeatherDay = {
  date: string;
  condition: WeatherCondition;
  label: string;
  max: number;
  min: number;
};

export type WeatherSnapshot = {
  current: {
    temperature: number;
    condition: WeatherCondition;
    label: string;
    wind: number;
  };
  daily: WeatherDay[];
  units: {
    temp: "°C" | "°F";
    wind: "km/h" | "mph";
  };
};

const WMO: Record<number, { condition: WeatherCondition; label: string }> = {
  0: { condition: "clear", label: "Clear" },
  1: { condition: "partly-cloudy", label: "Mostly clear" },
  2: { condition: "partly-cloudy", label: "Partly cloudy" },
  3: { condition: "cloudy", label: "Overcast" },
  45: { condition: "fog", label: "Fog" },
  48: { condition: "fog", label: "Rime fog" },
  51: { condition: "drizzle", label: "Light drizzle" },
  53: { condition: "drizzle", label: "Drizzle" },
  55: { condition: "drizzle", label: "Dense drizzle" },
  56: { condition: "drizzle", label: "Freezing drizzle" },
  57: { condition: "drizzle", label: "Freezing drizzle" },
  61: { condition: "rain", label: "Light rain" },
  63: { condition: "rain", label: "Rain" },
  65: { condition: "rain", label: "Heavy rain" },
  66: { condition: "rain", label: "Freezing rain" },
  67: { condition: "rain", label: "Freezing rain" },
  71: { condition: "snow", label: "Light snow" },
  73: { condition: "snow", label: "Snow" },
  75: { condition: "snow", label: "Heavy snow" },
  77: { condition: "snow", label: "Snow grains" },
  80: { condition: "rain", label: "Rain showers" },
  81: { condition: "rain", label: "Rain showers" },
  82: { condition: "rain", label: "Violent rain showers" },
  85: { condition: "snow", label: "Snow showers" },
  86: { condition: "snow", label: "Heavy snow showers" },
  95: { condition: "thunderstorm", label: "Thunderstorm" },
  96: { condition: "thunderstorm", label: "Thunderstorm with hail" },
  99: { condition: "thunderstorm", label: "Thunderstorm with hail" },
};

function decodeWmo(code: number): { condition: WeatherCondition; label: string } {
  return WMO[code] ?? { condition: "cloudy", label: "Unknown" };
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
};

export async function fetchWeather({
  lat,
  lon,
  units,
  days,
}: {
  lat: number;
  lon: number;
  units: WeatherUnits;
  days: number;
}): Promise<WeatherSnapshot> {
  const tempUnit = units === "imperial" ? "fahrenheit" : "celsius";
  const windUnit = units === "imperial" ? "mph" : "kmh";

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: String(Math.max(1, days + 1)),
    timezone: "auto",
    temperature_unit: tempUnit,
    wind_speed_unit: windUnit,
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 600 },
    headers: { "User-Agent": "nook-dashboard/1.0" },
  });
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;

  const c = data.current ?? {};
  const currentDecoded = decodeWmo(c.weather_code ?? 3);

  const dailyTime = data.daily?.time ?? [];
  const dailyCode = data.daily?.weather_code ?? [];
  const dailyMax = data.daily?.temperature_2m_max ?? [];
  const dailyMin = data.daily?.temperature_2m_min ?? [];

  const daily: WeatherDay[] = dailyTime
    .slice(1, 1 + days)
    .map((date, i) => {
      const decoded = decodeWmo(dailyCode[i + 1] ?? 3);
      return {
        date,
        condition: decoded.condition,
        label: decoded.label,
        max: Math.round(dailyMax[i + 1] ?? 0),
        min: Math.round(dailyMin[i + 1] ?? 0),
      };
    });

  return {
    current: {
      temperature: Math.round(c.temperature_2m ?? 0),
      condition: currentDecoded.condition,
      label: currentDecoded.label,
      wind: Math.round(c.wind_speed_10m ?? 0),
    },
    daily,
    units: {
      temp: units === "imperial" ? "°F" : "°C",
      wind: units === "imperial" ? "mph" : "km/h",
    },
  };
}
