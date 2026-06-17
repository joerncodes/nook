import { TodoistApi, type Task } from "@doist/todoist-sdk";
import { WidgetListItem } from "./shared";

type Props = {
  token: string;
  filter: string;
  limit?: number;
  hideSubtasks?: boolean;
};

const cachedFetch = async (
  url: string,
  options?: RequestInit & { timeout?: number },
) => {
  const res = await fetch(url, {
    ...options,
    next: { revalidate: 300, tags: ["todoist-tasks"] },
  });
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
    text: () => res.text(),
    json: () => res.json(),
  };
};

async function fetchAllPages<T>(
  pull: (cursor: string | null) => Promise<{ results: T[]; nextCursor: string | null }>,
  cap = 500,
): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | null = null;
  do {
    const page = await pull(cursor);
    out.push(...page.results);
    cursor = page.nextCursor;
  } while (cursor && out.length < cap);
  return out;
}

type ProjectLite = { id: string; name: string; inboxProject?: boolean };

async function fetchData(
  token: string,
  filter: string,
): Promise<{ tasks: Task[]; projects: Map<string, ProjectLite> }> {
  const api = new TodoistApi(token, { customFetch: cachedFetch });
  const [tasks, projects] = await Promise.all([
    fetchAllPages((cursor) =>
      api.getTasksByFilter({ query: filter, cursor, limit: 200 }),
    ),
    fetchAllPages((cursor) => api.getProjects({ cursor, limit: 200 })),
  ]);
  const projectMap = new Map<string, ProjectLite>(
    projects.map((p) => [
      p.id,
      {
        id: p.id,
        name: p.name,
        inboxProject: "inboxProject" in p ? p.inboxProject : false,
      },
    ]),
  );
  return { tasks, projects: projectMap };
}

function todayLocalISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isOverdue(task: Task): boolean {
  if (!task.due) return false;
  const today = todayLocalISODate();
  if (task.due.datetime) {
    return new Date(task.due.datetime) < new Date(`${today}T00:00:00`);
  }
  return task.due.date < today;
}

function formatDue(task: Task): string | null {
  if (!task.due) return null;
  if (task.due.datetime) {
    const d = new Date(task.due.datetime);
    return d.toLocaleString(undefined, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  if (task.due.date) {
    const [y, m, day] = task.due.date.split("-").map(Number);
    const d = new Date(y, (m ?? 1) - 1, day ?? 1);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }
  if (task.due.string) return task.due.string;
  return null;
}

function sortKey(task: Task): string {
  return task.due?.datetime ?? task.due?.date ?? "￿";
}

export async function TodoistWidget({
  token,
  filter,
  limit = 10,
  hideSubtasks = false,
}: Props) {
  let tasks: Task[] = [];
  let projects = new Map<string, ProjectLite>();
  let error: string | null = null;
  try {
    const data = await fetchData(token, filter);
    tasks = data.tasks;
    projects = data.projects;
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to fetch";
  }

  if (error) {
    return (
      <div className="todoist-error text-sm text-destructive">
        Todoist: {error}
      </div>
    );
  }

  if (tasks.length === 0) {
    return <p className="widget-empty">Inbox zero.</p>;
  }

  const filtered = hideSubtasks ? tasks.filter((t) => !t.parentId) : tasks;
  const shown = [...filtered]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .slice(0, limit);

  return (
    <ul className="todoist widget-list">
      {shown.map((t) => {
        const overdue = isOverdue(t);
        const due = formatDue(t);
        const project = projects.get(t.projectId);
        const projectName =
          project && !project.inboxProject ? project.name : null;
        const meta =
          projectName || due ? (
            <>
              {projectName && (
                <span className="todoist-project">{projectName}</span>
              )}
              {projectName && due && (
                <span className="todoist-meta-sep"> · </span>
              )}
              {due && <span className="todoist-due">{due}</span>}
            </>
          ) : undefined;
        return (
          <WidgetListItem
            key={t.id}
            href={t.url}
            title={t.content}
            meta={meta}
            dataAttrs={{
              "data-overdue": overdue ? "true" : undefined,
              "data-priority": t.priority,
            }}
          />
        );
      })}
    </ul>
  );
}
