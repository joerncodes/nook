import type { Widget } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClockWidget } from "./clock";
import { SearchWidget } from "./search";
import { LinksWidget } from "./links";
import { NoteWidget } from "./note";
import { RssWidget } from "./rss";
import { GreetingWidget } from "./greeting";
import { ReadwiseWidget } from "./readwise";
import { TodoistWidget } from "./todoist";
import { ImmichWidget } from "./immich";
import { JellyfinWidget } from "./jellyfin";
import { EdgewiseWidget } from "./edgewise";
import { LinkwardenWidget } from "./linkwarden";
import { WeatherWidget } from "./weather";

function renderBody(w: Widget) {
  switch (w.type) {
    case "clock":
      return (
        <ClockWidget
          timezone={w.timezone}
          format24h={w.format24h}
          showDate={w.showDate}
          showWeek={w.showWeek}
          words={w.words}
        />
      );
    case "search":
      return <SearchWidget engine={w.engine} placeholder={w.placeholder} />;
    case "links":
      return <LinksWidget items={w.items} columns={w.columns} />;
    case "note":
      return <NoteWidget body={w.body} />;
    case "rss":
      return <RssWidget url={w.url} limit={w.limit} />;
    case "greeting":
      return <GreetingWidget name={w.name} />;
    case "readwise":
      return (
        <ReadwiseWidget
          token={w.token}
          showImage={w.showImage}
          hideWhenDone={w.hideWhenDone}
        />
      );
    case "todoist":
      return (
        <TodoistWidget
          token={w.token}
          filter={w.filter}
          limit={w.limit}
          hideSubtasks={w.hideSubtasks}
        />
      );
    case "immich":
      return (
        <ImmichWidget
          baseUrl={w.baseUrl}
          apiKey={w.apiKey}
          favorites={w.favorites}
          albumId={w.albumId}
          limit={w.limit}
          autoRotate={w.autoRotate}
          orientation={w.orientation}
          stats={w.stats}
        />
      );
    case "jellyfin":
      return (
        <JellyfinWidget
          title={w.title}
          baseUrl={w.baseUrl}
          apiKey={w.apiKey}
          userId={w.userId}
        />
      );
    case "edgewise":
      return (
        <EdgewiseWidget
          baseUrl={w.baseUrl}
          token={w.token}
          limit={w.limit}
        />
      );
    case "linkwarden":
      return (
        <LinkwardenWidget
          baseUrl={w.baseUrl}
          token={w.token}
          collectionId={w.collectionId}
          tagId={w.tagId}
          limit={w.limit}
          search={w.search}
          searchPlaceholder={w.searchPlaceholder}
        />
      );
    case "weather":
      return (
        <WeatherWidget
          lat={w.lat}
          lon={w.lon}
          label={w.label}
          units={w.units}
          days={w.days}
        />
      );
  }
}

const NAKED = new Set(["clock", "search", "greeting"]);
const SELF_TITLED = new Set(["jellyfin"]);

export function WidgetRenderer({ widget }: { widget: Widget }) {
  const body = renderBody(widget);

  if (NAKED.has(widget.type) && !widget.title) {
    return <div className="w-full">{body}</div>;
  }

  return (
    <Card className="w-full">
      {widget.title && !SELF_TITLED.has(widget.type) && (
        <CardHeader>
          <CardTitle className="widget-title">{widget.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>{body}</CardContent>
    </Card>
  );
}
