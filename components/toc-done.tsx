"use client";

import { useItems } from "fumadocs-core/toc";
import { useEffect, useLayoutEffect, useRef } from "react";

// The tick's corner, where the dot lands and the two strokes grow from, in its 20px box: under the line's middle
const CORNER = { x: 10, y: 14 };

/**
 * Read to the end, the dot at the foot of the line of the page's contents stays, and a second one drops from it
 * straight down the line to the tick's corner, from which the tick's two strokes grow (styles: .toc-done). Read back
 * up, it goes the way it came: the strokes draw back into the corner, and the dot rises back up into the line's. Before
 * the end was ever reached there is nothing to take back, so nothing moves.
 */
export function TocDone() {
  const items = useItems();
  const ref = useRef<HTMLSpanElement>(null);
  const done = items.length > 0 && items.at(-1)!.active;
  const shown = useRef(false);
  const state = done ? "in" : shown.current ? "out" : "rest";

  useEffect(() => {
    if (done) shown.current = true;
  }, [done]);

  // How far the dot drops: from the middle of the line's dot to the tick's corner
  useLayoutEffect(() => {
    const tick = ref.current;
    const dot = tick?.closest("#nd-toc")?.querySelector<HTMLElement>('[style*="offset-path"]');
    if (!done || !tick || !dot) return;
    const from = dot.getBoundingClientRect();
    const to = tick.getBoundingClientRect();
    tick.style.setProperty("--from-x", `${from.left + from.width / 2 - (to.left + CORNER.x)}px`);
    tick.style.setProperty("--from-y", `${from.top + from.height / 2 - (to.top + CORNER.y)}px`);
  }, [done]);

  if (items.length === 0) return null;
  return (
    <span ref={ref} className="toc-done" data-state={state} aria-hidden="true">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 14L5.5 9.5" pathLength={1} />
        <path d="M10 14L17 5" pathLength={1} />
      </svg>
    </span>
  );
}
