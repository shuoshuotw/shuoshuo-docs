import type { Item } from "fumadocs-core/page-tree";
import Link from "next/link";

type Direction = "previous" | "next";

/**
 * The chevron of transitions.dev's "Learn more hover": under the pointer it slides the way it points and its two arms
 * spread apart about their tip (styles: .t-learn). Drawn as two strokes, since one path cannot open.
 */
function Chevron({ direction }: { direction: Direction }) {
  const arms = direction === "next" ? ["M6 4L10 8", "M10 8L6 12"] : ["M10 4L6 8", "M6 8L10 12"];
  return (
    <span className="t-learn-chevron" aria-hidden="true">
      <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path className="t-learn-arm t-learn-arm-top" d={arms[0]} />
        <path className="t-learn-arm t-learn-arm-bot" d={arms[1]} />
      </svg>
    </span>
  );
}

function PagerLink({ item, direction }: { item: Item; direction: Direction }) {
  const next = direction === "next";
  return (
    <Link
      href={item.url}
      data-pager={direction}
      className={`t-learn flex flex-col gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-fd-accent/80 hover:text-fd-accent-foreground @max-lg:col-span-full ${next ? "text-end" : ""}`}
    >
      <div className={`inline-flex items-center gap-1.5 font-medium ${next ? "flex-row-reverse" : ""}`}>
        <Chevron direction={direction} />
        <p>{item.name}</p>
      </div>
      <p className="text-fd-muted-foreground">{item.description ?? (next ? "下一頁" : "上一頁")}</p>
    </Link>
  );
}

/** Fumadocs' previous and next buttons at a page's foot, in its own layout, with chevrons that answer the pointer. */
export function Pager({ previous, next }: { previous?: Item; next?: Item }) {
  if (!previous && !next) return null;
  return (
    <div className={`docs-pager @container grid gap-4 ${previous && next ? "grid-cols-2" : "grid-cols-1"}`}>
      {previous && <PagerLink item={previous} direction="previous" />}
      {next && <PagerLink item={next} direction="next" />}
    </div>
  );
}
