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
});

export const widgetSchema = z.discriminatedUnion("type", [
  clockWidget,
  searchWidget,
  linksWidget,
  noteWidget,
  rssWidget,
  greetingWidget,
  readwiseWidget,
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
