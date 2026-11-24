"use client";

import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { LoaderCircle, Play, Shuffle } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

// What the block shows: nothing yet, an answer, or a failure; a run under way keeps whichever was there
type Shown = { kind: "empty" } | { kind: "text"; text: string } | { kind: "failed" };

/**
 * The first command on the page, run for real: a reader sees what the API answers before they open a terminal, as it
 * answers it, in a code block of its own.
 */
export function TryCurl() {
  const [shown, setShown] = useState<Shown>({ kind: "empty" });
  const [loading, setLoading] = useState(false);
  const output = useRef<HTMLOutputElement>(null);
  const height = useRef(0);

  // The block eases to the height of what came back (a sentence over two lines, or one), as a card resizes
  useLayoutEffect(() => {
    const block = output.current?.querySelector<HTMLElement>("figure");
    if (!block) return;
    const to = block.offsetHeight;
    const from = height.current;
    height.current = to;
    if (!from || Math.abs(to - from) < 1 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    block.animate({ height: [`${from}px`, `${to}px`] }, { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  }, [shown]);

  const run = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://api.shuoshuotw.xyz/v1/quotes/random?format=text");
      if (!response.ok) throw new Error(String(response.status));
      setShown({ kind: "text", text: await response.text() });
    } catch {
      setShown({ kind: "failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="try-curl not-prose">
      <button type="button" className="try-button" disabled={loading} onClick={() => void run()}>
        {/* All three in one slot, the one for now shown: they cross-fade rather than swap */}
        <span className="try-icon" data-icon={loading ? "wait" : shown.kind === "empty" ? "play" : "again"} aria-hidden="true">
          <Play size={18} data-for="play" />
          <Shuffle size={18} data-for="again" />
          <LoaderCircle size={18} data-for="wait" className="try-spin" />
        </span>
        {shown.kind === "empty" ? "在這裡執行" : "再抽一句"}
      </button>
      {/* There from the start, empty until the first run; each answer comes in as the tabs' text does */}
      <output ref={output} className="try-output" aria-live="polite">
        <CodeBlock title="回應 · text/plain" className="try-response" allowCopy={shown.kind === "text"}>
          <Pre>
            <span key={shown.kind === "text" ? shown.text : shown.kind} className={shown.kind === "empty" ? "try-empty" : "try-text"}>
              {shown.kind === "text" ? shown.text : shown.kind === "failed" ? "沒有連上 API，請稍後再試。" : "這裡空空如也(∠・ω< )⌒☆！"}
            </span>
          </Pre>
        </CodeBlock>
      </output>
    </div>
  );
}
