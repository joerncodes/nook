import { promises as fs } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

const linkItem = z.object({
  title: z.string(),
  url: z.string(),
  icon: z.string().optional(),
});

const baseWidget = z.object({
  title: z.string().optional(),
});

const clockWidget = baseWidget.extend({
  type: z.literal("clock"),
  timezone: z.string().optional(),
  format24h: z.boolean().optional().default(true),
  showDate: z.boolean().optional().default(true),
  showWeek: z.boolean().optional().default(false),
  words: z.boolean().optional().default(false),
});

const searchWidget = baseWidget.extend({
  type: z.literal("search"),
  engine: z
    .enum(["duckduckgo", "google", "kagi", "brave", "startpage"])
    .optional()
    .default("duckduckgo"),
  placeholder: z.string().optional(),
});

const linksWidget = baseWidget.extend({
  type: z.literal("links"),
  items: z.array(linkItem),
  columns: z.number().int().min(1).max(4).optional().default(1),
});

const noteWidget = baseWidget.extend({
  type: z.literal("note"),
  body: z.string(),
});

const rssWidget = baseWidget.extend({
  type: z.literal("rss"),
  url: z.string(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

const greetingWidget = baseWidget.extend({
  type: z.literal("greeting"),
  name: z.string().optional(),
});

const readwiseWidget = baseWidget.extend({
  type: z.literal("readwise"),
  token: z.string().min(1),
  showImage: z.boolean().optional().default(false),
  hideWhenDone: z.boolean().optional().default(false),
});

const todoistWidget = baseWidget.extend({
  type: z.literal("todoist"),
  token: z.string().min(1),
  filter: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional().default(10),
  hideSubtasks: z.boolean().optional().default(false),
});

const immichWidget = baseWidget.extend({
  type: z.literal("immich"),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  mode: z.enum(["favorites", "onThisDay", "album"]).optional().default("favorites"),
  albumId: z.string().optional(), // required when mode is "album"
  limit: z.number().int().min(1).max(20).optional().default(6),
  autoRotate: z.boolean().optional().default(true),
  orientation: z.enum(["landscape", "portrait"]).optional(),
  stats: z.boolean().optional().default(true),
});

const jellyfinWidget = baseWidget.extend({
  type: z.literal("jellyfin"),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  userId: z.string().min(1),
  showLatestMovie: z.boolean().optional().default(true),
  coverSize: z.enum(["small", "medium", "large"]).optional().default("medium"),
});

const edgewiseWidget = baseWidget.extend({
  type: z.literal("edgewise"),
  baseUrl: z.string().url(),
  token: z.string().min(1),
  limit: z.number().int().min(1).max(20).optional().default(5),
});

const calendarSource = z.object({
  url: z.string().url(),
  label: z.string().optional(),
  color: z.string().optional(),
});

const calendarWidget = baseWidget.extend({
  type: z.literal("calendar"),
  sources: z.array(calendarSource).min(1),
  limit: z.number().int().min(1).max(20).optional().default(5),
  days: z.number().int().min(1).max(60).optional().default(14),
  showAllDay: z.boolean().optional().default(true),
  relativeDays: z.boolean().optional().default(true),
  showMonth: z.boolean().optional().default(true),
  weekStart: z.enum(["mon", "sun"]).optional().default("mon"),
});

const linkwardenWidget = baseWidget.extend({
  type: z.literal("linkwarden"),
  baseUrl: z.string().url(),
  token: z.string().min(1),
  collectionId: z.number().int().optional(),
  tagId: z.number().int().optional(),
  limit: z.number().int().min(1).max(20).optional().default(8),
  search: z.boolean().optional().default(true),
  searchPlaceholder: z.string().optional().default("Search bookmarks…"),
});

const kimaiWidget = baseWidget.extend({
  type: z.literal("kimai"),
  baseUrl: z.string().url(),
  token: z.string().min(1),
  limit: z.number().int().min(1).max(10).optional().default(5),
  weekStart: z.enum(["monday", "sunday"]).optional().default("monday"),
});

const weatherWidget = baseWidget.extend({
  type: z.literal("weather"),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  label: z.string().optional(),
  units: z.enum(["metric", "imperial"]).optional().default("metric"),
  days: z.number().int().min(0).max(7).optional().default(3),
});

export const widgetSchema = z.discriminatedUnion("type", [
  clockWidget,
  searchWidget,
  linksWidget,
  noteWidget,
  rssWidget,
  greetingWidget,
  readwiseWidget,
  todoistWidget,
  immichWidget,
  jellyfinWidget,
  edgewiseWidget,
  linkwardenWidget,
  calendarWidget,
  kimaiWidget,
  weatherWidget,
]);

export type Widget = z.infer<typeof widgetSchema>;

const column = z.object({
  width: z.number().min(1).max(12).optional(),
  widgets: z.array(widgetSchema),
});

export const themeSchema = z
  .enum(["quartz", "atrium", "marginalia"])
  .optional()
  .default("atrium");

export type Theme = z.infer<typeof themeSchema>;

export const dashboardConfigSchema = z.object({
  title: z.string().optional().default("nook"),
  theme: themeSchema,
  center: z.array(widgetSchema).optional().default([]),
  columns: z.array(column).optional().default([]),
});

export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;

const DEFAULT_CONFIG: DashboardConfig = {
  title: "nook",
  theme: "atrium",
  center: [
    { type: "clock", format24h: true, showDate: true, showWeek: false, words: false },
    { type: "search", engine: "duckduckgo" },
  ],
  columns: [
    {
      widgets: [
        {
          type: "links",
          title: "Dev",
          columns: 1,
          items: [
            { title: "GitHub", url: "https://github.com" },
            { title: "Vercel", url: "https://vercel.com" },
          ],
        },
      ],
    },
    {
      widgets: [
        {
          type: "links",
          title: "News",
          columns: 1,
          items: [
            { title: "Hacker News", url: "https://news.ycombinator.com" },
          ],
        },
      ],
    },
  ],
};

function configPath() {
  return (
    process.env.CONFIG_PATH ??
    path.join(/* turbopackIgnore: true */ process.cwd(), "config", "dashboard.yaml")
  );
}

export async function loadConfig(): Promise<DashboardConfig> {
  const file = configPath();
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = parseYaml(raw);
    return dashboardConfigSchema.parse(parsed ?? {});
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "ENOENT"
    ) {
      return DEFAULT_CONFIG;
    }
    throw err;
  }
}
