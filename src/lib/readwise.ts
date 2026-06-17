export type ReadwiseHighlight = {
  id: number;
  text: string;
  title?: string;
  author?: string;
  url?: string;
  source_url?: string;
  image_url?: string;
  tags?: { name: string }[];
};

export type ReadwiseReview = {
  review_id: number;
  review_url: string;
  review_completed: boolean;
  highlights: ReadwiseHighlight[];
};

export async function fetchDailyReview(
  token: string,
): Promise<ReadwiseReview> {
  const res = await fetch("https://readwise.io/api/v2/review/", {
    headers: { Authorization: `Token ${token}` },
    // The daily review changes once per day — cache for an hour.
    next: { revalidate: 3600, tags: ["readwise-review"] },
  });
  if (!res.ok) {
    throw new Error(`Readwise: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ReadwiseReview;
}
