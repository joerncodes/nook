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
      return <ReadwiseWidget token={w.token} showImage={w.showImage} />;
    case "todoist":
      return (
        <TodoistWidget
          token={w.token}
          filter={w.filter}
          limit={w.limit}
          hideSubtasks={w.hideSubtasks}
        />
      );
  }
}

const NAKED = new Set(["clock", "search", "greeting"]);

export function WidgetRenderer({ widget }: { widget: Widget }) {
  const body = renderBody(widget);

  if (NAKED.has(widget.type) && !widget.title) {
    return <div className="w-full">{body}</div>;
  }

  return (
    <Card className="w-full">
      {widget.title && (
        <CardHeader>
          <CardTitle className="widget-title">{widget.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>{body}</CardContent>
    </Card>
  );
}
