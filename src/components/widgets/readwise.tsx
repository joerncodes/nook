import { fetchDailyReview } from "@/lib/readwise";
import { ReadwiseClient } from "./readwise-client";

type Props = { token: string; showImage?: boolean; hideWhenDone?: boolean };

export async function ReadwiseWidget({
  token,
  showImage = false,
  hideWhenDone = false,
}: Props) {
  try {
    const review = await fetchDailyReview(token);
    return (
      <ReadwiseClient
        reviewId={review.review_id}
        reviewUrl={review.review_url}
        highlights={review.highlights}
        showImage={showImage}
        hideWhenDone={hideWhenDone}
      />
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load review";
    return <div className="text-sm text-destructive">Readwise: {msg}</div>;
  }
}
