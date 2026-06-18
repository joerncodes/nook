import { fetchRecentLinks, hostOf } from "@/lib/linkwarden";
import {
  LinkwardenSearch,
  type LinkwardenItem,
} from "./linkwarden-search";

type Props = {
  baseUrl: string;
  token: string;
  collectionId?: number;
  tagId?: number;
  limit: number;
  search: boolean;
  searchPlaceholder: string;
};

export async function LinkwardenWidget({
  baseUrl,
  token,
  collectionId,
  tagId,
  limit,
  search,
  searchPlaceholder,
}: Props) {
  let recent: LinkwardenItem[] = [];
  let error: string | null = null;
  try {
    const links = await fetchRecentLinks({
      baseUrl,
      token,
      limit,
      scope: { collectionId, tagId },
    });
    recent = links.map((l) => ({
      id: l.id,
      name: l.name || l.url,
      url: l.url,
      host: hostOf(l.url),
      collectionColor: l.collection?.color,
      collectionName: l.collection?.name,
    }));
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to fetch";
  }

  if (error) {
    return <div className="text-sm text-destructive">Linkwarden: {error}</div>;
  }

  return (
    <LinkwardenSearch
      recent={recent}
      placeholder={searchPlaceholder}
      showSearch={search}
    />
  );
}
