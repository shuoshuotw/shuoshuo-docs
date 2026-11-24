"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

const bare = (path: string) => path.replace(/\/$/, "") || "/";

type Turn = "down" | "up" | "next" | "previous";

const turnOf = (from: number, to: number, sideways: boolean): Turn => (sideways ? (to > from ? "next" : "previous") : to > from ? "down" : "up");

// Where the page left goes: away from the side the next one comes in from (styles: page-in)
const AWAY: Record<Turn, string> = { down: "0 -16px", up: "0 16px", next: "-16px 0", previous: "16px 0" };

/**
 * How one page gives way to the next, as the back office steps through its cases (shuoshuo-client case-detail): the
 * page left slides a little away under a blur and fades, then the next one comes in from the other side (styles:
 * #nd-page). The way is chosen from where the two pages stand in the sidebar: one further down rises from below, one
 * further up comes down from above; from the buttons at a page's foot (components/pager.tsx) it is sideways, the next
 * page from the right and the previous one from the left. A change of page the reader did not click (the search, the
 * browser's back) only comes in.
 */
export function PageTurn({ order }: { order: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const last = useRef(pathname);
  const pager = useRef(false);

  useEffect(() => {
    const click = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]");
      pager.current = Boolean(link?.matches("[data-pager]"));
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      const from = order.indexOf(bare(location.pathname));
      const to = order.indexOf(bare(url.pathname));
      const page = document.getElementById("nd-page");
      if (url.origin !== location.origin || from === -1 || to === -1 || from === to || !page) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Next's Link leaves a click it finds handled alone; the page is changed once the old one has gone, the next one
      // fetched meanwhile
      event.preventDefault();
      const target = `${url.pathname}${url.search}${url.hash}`;
      router.prefetch(target);
      const turn = turnOf(from, to, pager.current);
      const away = page.animate(
        { opacity: [1, 0], filter: ["blur(0)", "blur(3px)"], translate: ["0 0", AWAY[turn]] },
        { duration: 110, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
      );
      const go = () => router.push(target);
      away.finished.then(go, go);
      // Should the next page never come, the old one is shown again rather than left blank
      setTimeout(() => page.isConnected && away.cancel(), 3000);
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, [order, router]);

  // In the commit that puts the new page in, before it is painted
  useLayoutEffect(() => {
    const from = order.indexOf(bare(last.current));
    const to = order.indexOf(bare(pathname));
    last.current = pathname;
    const sideways = pager.current;
    pager.current = false;
    if (from === -1 || to === -1 || from === to) return;
    document.documentElement.dataset.turn = turnOf(from, to, sideways);
  }, [pathname, order]);

  return null;
}
