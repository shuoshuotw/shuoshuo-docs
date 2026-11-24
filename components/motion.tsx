"use client";

import { useEffect } from "react";

// The main site's controls (shuoshuo-client motion/press.ts), with the wordmark in place of its own. Not a select's
// trigger: its list opens over it on the press and is placed from it then
const PRESSABLE = "button:not([disabled], [aria-haspopup='listbox']), [role='button']:not([aria-disabled='true']), [role='link'], a:has(> .docs-wordmark)";
// What ripples when clicked: the buttons, as every HeroUI Button does on the main site, and the sidebar's links, as its
// column of links does
const RIPPLES = "button:not([disabled], [aria-haspopup='listbox']), #nd-sidebar a";

// A little past its size and back, so letting go reads as a spring rather than a fade. Gentler than the main site's
// (1.07, then 0.98): on the docs' long columns of links the full spring read as a wobble
const BOUNCE: Keyframe[] = [
  { scale: "1.025", offset: 0.4, easing: "cubic-bezier(0.33, 1, 0.68, 1)" },
  { scale: "1" },
];

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// The main site's spring (shuoshuo-client styles/chrome.css --ease-spring)
const SPRING = "linear(0, 0.0185, 0.0697 3.07%, 0.2459 6.84%, 0.6092 13.06%, 0.8318 17.73%, 0.9468 21.9%, 1.0138 26.53%, 1.0434 31.42%, 1.0491 34.58%, 1.0449 38.83%, 1.0162 50.23%, 1.0009 61.35%, 0.997 73.04%, 1)";

// Every copy button the docs have: a code block's and an API example's (a clipboard), a heading's and a field's link
// (a link), the TypeScript one (two sheets); each swaps its icon for a tick while what it copied is fresh, the
// heading's for a tick on two sheets
const COPY_ICONS = ".lucide-clipboard, .lucide-copy, .lucide-link, .lucide-check, .lucide-copy-check";
// lucide's Copy, the main site's toolbar icon, drawn in place of Fumadocs' clipboard
const SHEETS = '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>';
// lucide's Check, drawn in place of the heading's tick on two sheets, so every copy button answers with the same tick
const TICK = '<path d="M20 6 9 17l-5-5"></path>';

/**
 * The main site's toolbar copy button (shuoshuo-client styles/home.css .copy-swap) on every copy button here: the copy
 * icon blurs off upward, turning, as the green tick springs in, small and turned, and writes itself from its left
 * foot; going back, the copy icon springs back. Fumadocs swaps one icon for the other, so the one leaving is shown by
 * a copy of it laid where it was, gone once it has faded.
 */
function installCopySwap() {
  const sheets = (icon: Element) => {
    if (icon.matches(".lucide-clipboard")) icon.innerHTML = SHEETS;
    if (icon.matches(".lucide-copy-check")) {
      icon.innerHTML = TICK;
      icon.classList.add("lucide-check");
    }
  };
  document.querySelectorAll("button > svg.lucide-clipboard").forEach(sheets);

  const play = (button: HTMLElement, icon: SVGElement, gone: SVGElement) => {
    const ticked = icon.matches(".lucide-check");
    const frame = button.getBoundingClientRect();
    const place = icon.getBoundingClientRect();
    const ghost = gone.cloneNode(true) as SVGElement;
    ghost.classList.add("copy-ghost");
    Object.assign(ghost.style, { left: `${place.left - frame.left - button.clientLeft}px`, top: `${place.top - frame.top - button.clientTop}px` });
    button.append(ghost);
    const away = ticked
      ? { opacity: [1, 0], filter: ["blur(0)", "blur(2px)"], transform: ["none", "translateY(-5px) rotate(24deg) scale(0.5)"] }
      : { opacity: [1, 0], transform: ["none", "scale(0.6)"] };
    const drop = () => ghost.remove();
    ghost.animate(away, { duration: 150, easing: "ease-in-out", fill: "forwards" }).finished.then(drop, drop);
    if (!ticked) {
      icon.animate({ opacity: [0, 1], filter: ["blur(2px)", "blur(0)"], transform: ["translateY(-5px) rotate(24deg) scale(0.5)", "none"] }, { duration: 400, easing: SPRING });
      return;
    }
    icon.animate({ opacity: [0, 1], transform: ["scale(0.4) rotate(-40deg)", "none"] }, { duration: 400, easing: SPRING });
    // lucide's tick runs from its right arm to its left foot: written backwards from its end, it reads left to right
    const stroke = icon.querySelector("path");
    if (stroke) {
      const length = stroke.getTotalLength();
      stroke.animate({ strokeDasharray: [`${length}`, `${length}`], strokeDashoffset: [`${-length}`, "0"] }, { duration: 260, delay: 40, easing: "ease-out", fill: "backwards" });
    }
  };

  // React takes the old icon out and puts the new one in as two changes, so they are paired up per button
  const watch = new MutationObserver((records) => {
    const gone = new Map<Node, SVGElement>();
    for (const record of records) for (const node of record.removedNodes) if (node instanceof SVGElement && node.matches(COPY_ICONS)) gone.set(record.target, node);
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node instanceof SVGElement && node.matches(COPY_ICONS) && record.target instanceof HTMLButtonElement) {
          sheets(node);
          const old = gone.get(record.target);
          if (old && !reduced()) play(record.target, node, old);
        } else node.querySelectorAll("button > svg.lucide-clipboard").forEach(sheets);
      }
    }
  });
  watch.observe(document.body, { childList: true, subtree: true });
  return () => watch.disconnect();
}

/**
 * The main site's spring for its select (shuoshuo-client motion/spring.ts springEase): a damped spring sampled into a
 * CSS `linear()` easing, with the time it takes to settle.
 */
function springEase(stiffness: number, damping: number) {
  const dt = 1 / 240;
  const points = ["0"];
  let x = 0;
  let v = 0;
  let steps = 0;
  while (steps < 480 && (Math.abs(1 - x) > 0.001 || Math.abs(v) > 0.05)) {
    v += (stiffness * (1 - x) - damping * v) * dt;
    x += v * dt;
    if (++steps % 4 === 0) points.push(x.toFixed(4));
  }
  points.push("1");
  return { easing: `linear(${points.join(", ")})`, duration: Math.round(steps * dt * 1000) };
}

// The docs' menus: the one over the search box (Fumadocs' Radix popover) and the API pages' selects (Base UI)
const MENUS = "[data-radix-popper-content-wrapper] > [role='dialog'], [data-base-ui-portal] [role='presentation']:has(> [role='listbox'])";
const OPEN_EASE = springEase(300, 26);
const SHUT_MS = 340;
const SHUT_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

/**
 * The main site's select (shuoshuo-client components/form.tsx ChoiceField) on the docs' menus: opening, the menu
 * starts as its trigger's band around the current choice, laid over the trigger, and grows out above and below it
 * while the other choices come in, nearest first; closing, the other choices go and the menu folds around the one
 * picked, carrying it back onto the trigger, and then fades. The menus stay on the page for the fold (styles:
 * menu-hold).
 */
function installMenus() {
  const rowsOf = (menu: Element) => [...menu.querySelectorAll<HTMLElement>(":scope > a, [role='option']")];
  const currentOf = (rows: HTMLElement[]) => rows.find((row) => row.matches("[aria-selected='true']") || row.querySelector("svg.lucide-check:not(.invisible)")) ?? rows[0];
  const triggerOf = (menu: Element) =>
    (menu.id ? document.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(menu.id)}"]`) : null) ??
    document.querySelector<HTMLElement>("button[role='combobox'][aria-expanded='true']");
  // The trigger's band about a row, measured from the menu's top, and how far the menu must move to lay it on the trigger
  const bandOf = (menu: HTMLElement, row: HTMLElement, trigger: HTMLElement) => {
    const box = menu.getBoundingClientRect();
    const on = trigger.getBoundingClientRect();
    const middle = row.getBoundingClientRect().top + row.offsetHeight / 2 - box.top;
    const top = Math.min(Math.max(0, middle - on.height / 2), Math.max(0, box.height - on.height));
    return { clip: `inset(${top}px 0 ${Math.max(0, box.height - top - on.height)}px 0 round ${getComputedStyle(trigger).borderRadius})`, shift: `0 ${on.top - box.top - top}px` };
  };
  const picked = new WeakMap<Element, HTMLElement>();
  const triggers = new WeakMap<Element, HTMLElement>();
  const opened = new WeakMap<Element, number>();

  // What the last fold left held on a menu kept on the page (Base UI keeps a select's): left there, the menu opened
  // again unseen, folded to a band and faded, and never showed
  const settle = (menu: HTMLElement) => {
    for (const element of [menu, ...rowsOf(menu)]) for (const animation of element.getAnimations()) if (!(animation instanceof CSSAnimation)) animation.cancel();
  };

  // The trigger's own words and icon, changed by the pick, come in as the menu's last trace fades
  const freshen = (trigger: HTMLElement) => {
    let done = false;
    const watch = new MutationObserver(() => {
      if (done) return;
      done = true;
      watch.disconnect();
      for (const part of trigger.children) {
        if (part.matches("svg:last-child")) continue;
        part.animate({ opacity: [0, 1], filter: ["blur(2px)", "blur(0)"], translate: ["0 4px", "0 0"] }, { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      }
    });
    watch.observe(trigger, { childList: true, subtree: true, characterData: true });
    setTimeout(() => watch.disconnect(), 2000);
  };

  const open = (menu: HTMLElement) => {
    // Once per opening, whether it was put on the page or shown again
    const now = performance.now();
    if (now - (opened.get(menu) ?? -Infinity) < 150) return;
    opened.set(menu, now);
    settle(menu);
    // Held out of sight until it has been placed, a frame on
    const hide = menu.animate({ opacity: [0, 0] }, { duration: 1000, fill: "forwards" });
    requestAnimationFrame(() => {
      hide.cancel();
      const rows = rowsOf(menu);
      const trigger = triggerOf(menu);
      if (!trigger || rows.length === 0) return;
      triggers.set(menu, trigger);
      const current = currentOf(rows)!;
      const at = rows.indexOf(current);
      const band = bandOf(menu, current, trigger);
      menu.animate({ clipPath: [band.clip, `inset(0 round ${getComputedStyle(menu).borderRadius})`], translate: [band.shift, "0 0"] }, OPEN_EASE);
      rows.forEach((row, position) => {
        const distance = Math.abs(position - at);
        if (distance > 0) row.animate({ opacity: [0, 1], filter: ["blur(3px)", "blur(0)"] }, { duration: 260, delay: 40 + distance * 26, easing: "ease-out", fill: "backwards" });
      });
    });
  };

  const shut = (menu: HTMLElement) => {
    const rows = rowsOf(menu);
    const trigger = triggers.get(menu) ?? triggerOf(menu);
    if (!trigger || rows.length === 0) return;
    for (const element of [menu, ...rows]) for (const animation of element.getAnimations()) if (!(animation instanceof CSSAnimation)) animation.finish();
    const target = picked.get(menu) ?? currentOf(rows)!;
    picked.delete(menu);
    freshen(trigger);
    const radius = getComputedStyle(menu).borderRadius;
    // A row with more in it than its trigger shows (the menu over the search box: a name and a line under it) cannot
    // be carried onto the trigger whole: every row goes, and the menu folds into the trigger's own box instead
    const whole = target.offsetHeight <= trigger.offsetHeight + 8;
    for (const row of rows) if (!whole || row !== target) row.animate({ opacity: [1, 0], filter: ["blur(0)", "blur(3px)"] }, { duration: whole ? 160 : 120, easing: "ease-out", fill: "forwards" });
    const box = menu.getBoundingClientRect();
    const on = trigger.getBoundingClientRect();
    const band = whole
      ? bandOf(menu, target, trigger)
      : { clip: `inset(0 0 ${Math.max(0, box.height - on.height)}px 0 round ${getComputedStyle(trigger).borderRadius})`, shift: `${on.left - box.left}px ${on.top - box.top}px` };
    menu.animate({ clipPath: [`inset(0 round ${radius})`, band.clip], translate: ["0 0", band.shift] }, { duration: SHUT_MS, easing: SHUT_EASE, fill: "forwards" });
    menu.animate({ opacity: [1, 0] }, { duration: whole ? 110 : 160, delay: whole ? SHUT_MS : SHUT_MS - 120, easing: "linear", fill: "forwards" });
  };

  // The row pressed is the one the menu folds around, though the page it leads to has not opened yet
  const press = (event: PointerEvent) => {
    const row = (event.target as Element | null)?.closest?.<HTMLElement>(":is(a, [role='option'])");
    const menu = row?.closest(MENUS);
    if (row && menu) picked.set(menu, row);
  };

  const watch = new MutationObserver((records) => {
    if (reduced()) return;
    for (const record of records) {
      if (record.type === "childList") {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          for (const menu of node.matches(MENUS) ? [node] : node.querySelectorAll(MENUS)) open(menu as HTMLElement);
        }
      } else if (record.target instanceof HTMLElement && record.target.matches(MENUS)) {
        const menu = record.target;
        if (menu.dataset.state === "closed" || menu.hasAttribute("data-ending-style")) shut(menu);
        // Shown again where it was kept (a Base UI select opened a second time)
        else if (record.attributeName === "data-open" && menu.hasAttribute("data-open")) open(menu);
      }
    }
  });
  watch.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state", "data-ending-style", "data-open"] });
  addEventListener("pointerdown", press, { capture: true, passive: true });
  return () => {
    watch.disconnect();
    removeEventListener("pointerdown", press, { capture: true });
  };
}

/** Every control gives under the finger and springs back when let go; the wordmark's red strokes are written again. */
function installPressSpring() {
  const held = new Map<HTMLElement, Animation>();
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || reduced()) return;
    const control = (event.target as Element).closest<HTMLElement>(PRESSABLE);
    if (!control || held.has(control)) return;
    held.set(control, control.animate([{ scale: "1" }, { scale: "0.96" }], { duration: 120, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }));
    control.querySelectorAll(".logo-stroke").forEach((stroke, index) =>
      stroke.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 1, offset: 0.3 }, { strokeDashoffset: 0 }], { duration: 640, delay: index * 90, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }),
    );
  };
  const up = () => {
    for (const [control, press] of held) {
      // From wherever a quick tap left it
      const from = getComputedStyle(control).scale;
      press.cancel();
      control.animate([{ scale: from === "none" ? "1" : from }, ...BOUNCE], { duration: 420 });
    }
    held.clear();
  };
  addEventListener("pointerdown", down, { capture: true, passive: true });
  addEventListener("pointerup", up, { capture: true, passive: true });
  addEventListener("pointercancel", up, { capture: true, passive: true });
  return () => {
    removeEventListener("pointerdown", down, { capture: true });
    removeEventListener("pointerup", up, { capture: true });
    removeEventListener("pointercancel", up, { capture: true });
  };
}

/**
 * The main site's ripple (shuoshuo-client motion/ripple.ts): a disc of the control's own colour from where it was
 * clicked, or its middle for a key, growing to twice its size as it fades. On the click, so a finger that starts a
 * scroll on a control sets none off. It goes in a layer of the control's shape, under its contents.
 */
function installRipples() {
  const click = (event: MouseEvent) => {
    const host = (event.target as Element | null)?.closest?.<HTMLElement>(RIPPLES);
    if (!host || reduced()) return;
    const box = host.getBoundingClientRect();
    const x = event.detail === 0 ? box.width / 2 : event.clientX - box.left;
    const y = event.detail === 0 ? box.height / 2 : event.clientY - box.top;
    const style = getComputedStyle(host);
    if (style.position === "static") host.style.position = "relative";
    if (style.zIndex === "auto") host.style.isolation = "isolate";
    const layer = document.createElement("span");
    layer.className = "ripple-layer";
    layer.setAttribute("aria-hidden", "true");
    const size = Math.max(host.clientWidth, host.clientHeight);
    const disc = document.createElement("span");
    disc.className = "ripple-disc";
    Object.assign(disc.style, { width: `${size}px`, height: `${size}px`, left: `${x - size / 2}px`, top: `${y - size / 2}px` });
    layer.append(disc);
    host.append(layer);
    const duration = Math.min(Math.max(0.01 * size, 0.2), size > 100 ? 0.75 : 0.5) * 1000;
    const done = () => layer.remove();
    disc.animate({ transform: ["scale(0)", "scale(2)"], opacity: [0.35, 0] }, { duration, easing: "cubic-bezier(0.25, 0.1, 0.25, 1)" }).finished.then(done, done);
  };
  document.addEventListener("click", click, true);
  return () => document.removeEventListener("click", click, true);
}

// What an API page swaps under a click (fumadocs-openapi): the sections of its left column (the response by status
// code, the Playground) and the example cards of its right one (by status code or language)
const TWEENED = '#nd-page [class*="@4xl:flex-row"] > .min-w-0.flex-1 > *, #nd-page [class*="@4xl:w-[400px]"] .prose-no-margin > *';

/**
 * transitions.dev's card resize: a block whose contents a click or a key swaps for taller or shorter ones eases to its
 * new height instead of jumping, and what lies under it moves with it. Only right after the reader's own input, so a
 * font arriving or the window resizing never sets one off.
 */
function installHeightTween() {
  let input = -Infinity;
  const heights = new WeakMap<Element, number>();
  const tweening = new WeakSet<Element>();
  const observer = new ResizeObserver((entries) => {
    for (const { target, borderBoxSize } of entries) {
      // Each frame of its own tween reports a size too; the height it lands on is taken when it ends
      if (tweening.has(target)) continue;
      const to = borderBoxSize[0]!.blockSize;
      const from = heights.get(target);
      heights.set(target, to);
      if (from === undefined || Math.abs(to - from) < 1 || performance.now() - input > 600 || reduced()) continue;
      const block = target as HTMLElement;
      tweening.add(block);
      block.style.overflow = "clip";
      const done = () => {
        tweening.delete(block);
        block.style.removeProperty("overflow");
        heights.set(block, block.getBoundingClientRect().height);
      };
      block.animate({ height: [`${from}px`, `${to}px`] }, { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }).finished.then(done, done);
    }
  });
  // Blocks are watched as the reader reaches for them, so a page's own are found after every change of page
  const watch = () => document.querySelectorAll(TWEENED).forEach((block) => observer.observe(block));
  const touch = () => {
    input = performance.now();
    watch();
  };
  const key = () => {
    input = performance.now();
  };
  addEventListener("pointerdown", touch, { capture: true, passive: true });
  addEventListener("focusin", watch, { capture: true, passive: true });
  addEventListener("keydown", key, { capture: true, passive: true });
  watch();
  return () => {
    observer.disconnect();
    removeEventListener("pointerdown", touch, { capture: true });
    removeEventListener("focusin", watch, { capture: true });
    removeEventListener("keydown", key, { capture: true });
  };
}

// The sidebar's rows (Fumadocs: a page's link carries data-active, a folder's button aria-expanded)
const SIDEBAR_ROW = "#nd-sidebar [data-radix-scroll-area-viewport] :is(a[data-active], button[aria-expanded])";

/**
 * One highlight under the pointer in the sidebar, gliding from row to row as the pointer moves down or up the list,
 * instead of each row lighting up by itself (styles: .sidebar-glow). It comes in at the first row reached, and fades
 * as the pointer leaves the list.
 */
function installSidebarGlow() {
  let glow: HTMLElement | null = null;
  const hide = () => {
    if (glow) delete glow.dataset.on;
  };
  const over = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const row = (event.target as Element | null)?.closest?.<HTMLElement>(SIDEBAR_ROW);
    const list = row?.closest<HTMLElement>("[data-radix-scroll-area-viewport]");
    if (!row || !list) return;
    if (glow?.parentElement !== list) {
      glow?.remove();
      glow = document.createElement("span");
      glow.className = "sidebar-glow";
      glow.setAttribute("aria-hidden", "true");
      list.append(glow);
    }
    const box = row.getBoundingClientRect();
    const frame = list.getBoundingClientRect();
    Object.assign(glow.style, {
      width: `${box.width}px`,
      height: `${box.height}px`,
      transform: `translate(${box.left - frame.left + list.scrollLeft}px, ${box.top - frame.top + list.scrollTop}px)`,
    });
    // Reached from outside the list, it starts at the row instead of gliding in from the last one it left
    if (glow.dataset.on === undefined) {
      glow.style.transition = "none";
      void glow.offsetWidth;
      glow.style.removeProperty("transition");
      glow.dataset.on = "";
    }
  };
  const out = (event: PointerEvent) => {
    const list = glow?.parentElement;
    if (list && list.contains(event.target as Node) && !list.contains(event.relatedTarget as Node | null)) hide();
  };
  document.addEventListener("pointerover", over, { passive: true });
  document.addEventListener("pointerout", out, { passive: true });
  return () => {
    document.removeEventListener("pointerover", over);
    document.removeEventListener("pointerout", out);
    glow?.remove();
  };
}

/**
 * The sidebar's mark on the page shown glides from the row left to the row reached when a link in the page (its text,
 * its pager) changes the page, rather than going out on one and lighting on the other (styles: .sidebar-mark); a row
 * of the sidebar clicked lights where it is, as does a change the reader did not click (the search, the browser's
 * back). A copy of the mark makes the trip; both rows hold their own colouring back until it lands. A row that cannot
 * be seen (in a closed folder, or the other part of the docs) gets its mark as before.
 */
function installSidebarMark() {
  let land: (() => void) | null = null;
  let fromPage = false;
  const click = (event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>("#nd-page a[href]");
    fromPage = Boolean(link && link.pathname !== location.pathname);
  };
  const watch = new MutationObserver((records) => {
    let from: HTMLElement | null = null;
    let to: HTMLElement | null = null;
    for (const record of records) {
      // The contents' links carry data-active too, changing as the page is read
      const row = record.target as HTMLElement;
      if (!row.closest("#nd-sidebar")) continue;
      if (record.oldValue === "true" && row.dataset.active === "false") from = row;
      if (record.oldValue === "false" && row.dataset.active === "true") to = row;
    }
    if (!from && !to) return;
    const linked = fromPage;
    fromPage = false;
    const list = to?.closest<HTMLElement>("#nd-sidebar [data-radix-scroll-area-viewport]");
    if (!linked || !from || !to || !list?.contains(from) || reduced()) return;
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    if (!a.height || !b.height) return;
    land?.();
    const frame = list.getBoundingClientRect();
    const at = (box: DOMRect) => `translate(${box.left - frame.left + list.scrollLeft}px, ${box.top - frame.top + list.scrollTop}px)`;
    const reached = to;
    const rows = [from, to];
    // Their words still change colour as before; only the ground under them waits for the mark
    for (const row of rows) row.style.transitionProperty = "color";
    reached.dataset.marking = "";
    const mark = document.createElement("span");
    mark.className = "sidebar-mark";
    mark.setAttribute("aria-hidden", "true");
    list.append(mark);
    const trip = mark.animate(
      { transform: [at(a), at(b)], width: [`${a.width}px`, `${b.width}px`], height: [`${a.height}px`, `${b.height}px`] },
      { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
    );
    const done = () => {
      if (land !== done) return;
      land = null;
      delete reached.dataset.marking;
      // The row's own ground is there before the copy goes, with no fade between them
      void reached.offsetWidth;
      for (const row of rows) row.style.removeProperty("transition-property");
      mark.remove();
    };
    land = done;
    trip.finished.then(done, done);
  });
  watch.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-active"], attributeOldValue: true });
  document.addEventListener("click", click, true);
  return () => {
    watch.disconnect();
    document.removeEventListener("click", click, true);
    land?.();
  };
}

// The words under the Playground's 回應 saying what its status code means, changed in place with the code
const STATUS_WORDS = ".prose-xs.prose-no-margin.text-fd-muted-foreground";

/**
 * The Playground's response, switched to another status code, has the words saying what the code means come in as the
 * page's own response does (styles: tab-pop-in): React changes them where they are, so the page's animation, which
 * plays as a part is shown, never played again.
 */
function installStatusWords() {
  const popped = new WeakSet<Element>();
  const watch = new MutationObserver((records) => {
    if (reduced()) return;
    for (const record of records) {
      const node = record.target.nodeType === Node.TEXT_NODE ? record.target.parentElement : (record.target as Element);
      const words = node?.closest?.(STATUS_WORDS);
      if (!words || popped.has(words)) continue;
      popped.add(words);
      requestAnimationFrame(() => popped.delete(words));
      words.animate({ opacity: [0, 1], filter: ["blur(2px)", "blur(0)"], translate: ["0 8px", "0 0"] }, { duration: 500, easing: "cubic-bezier(0.34, 1.45, 0.64, 1)" });
    }
  });
  watch.observe(document.body, { subtree: true, childList: true, characterData: true });
  return () => watch.disconnect();
}

// The name of the part being read, in the phone's bar of the page's contents (Fumadocs' TOC popover trigger)
const TOC_TITLE = "[data-toc-popover-trigger] > span > span:nth-child(2)";

/**
 * When the phone's bar of the page's contents names another part, the new name comes in from the side the reading
 * went, from below while reading on down and from above going back up, and the old one leaves the other way.
 */
function installTocTitle() {
  let lastY = scrollY;
  let way = 1;
  const scroll = () => {
    if (scrollY !== lastY) way = scrollY > lastY ? 1 : -1;
    lastY = scrollY;
  };
  const slide = (title: HTMLElement, old: string) => {
    const ghost = title.cloneNode(false) as HTMLElement;
    ghost.textContent = old;
    ghost.setAttribute("aria-hidden", "true");
    title.after(ghost);
    const drop = () => ghost.remove();
    ghost
      .animate({ opacity: [1, 0], translate: ["0 0", `0 ${-way * 70}%`], filter: ["blur(0)", "blur(2px)"] }, { duration: 200, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" })
      .finished.then(drop, drop);
    title.animate({ opacity: [0, 1], translate: [`0 ${way * 70}%`, "0 0"], filter: ["blur(2px)", "blur(0)"] }, { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  };
  const watch = new MutationObserver((records) => {
    if (reduced()) return;
    for (const record of records) {
      const title = (record.target.nodeType === Node.TEXT_NODE ? record.target.parentElement : record.target) as HTMLElement | null;
      if (!title?.matches?.(TOC_TITLE)) continue;
      const old = record.type === "characterData" ? (record.oldValue ?? "") : [...record.removedNodes].map((node) => node.textContent ?? "").join("");
      if (old && old !== title.textContent) slide(title, old);
    }
  });
  watch.observe(document.body, { subtree: true, childList: true, characterData: true, characterDataOldValue: true });
  addEventListener("scroll", scroll, { passive: true });
  return () => {
    watch.disconnect();
    removeEventListener("scroll", scroll);
  };
}

// The button over the sidebar naming the part of the docs being read (Fumadocs' tabs dropdown, its chevrons last)
const PART_BUTTON = ":is(#nd-sidebar, #nd-sidebar-mobile) button:has(> svg.lucide-chevrons-up-down)";

/**
 * When a change of page takes the reader to another part of the docs, the button naming the part swaps its icon as
 * transitions.dev's icon swap (the old one and the new cross-fade in one slot, through a blur and a scale) and its name
 * as its text states swap (the old name leaves upward under a blur, then the new one rises into place; styles:
 * .t-icon-swap, .t-text-swap). React has already put the new ones in, so what was shown is kept as a copy each time,
 * to play the part leaving.
 */
function installPartSwap() {
  const shown = new WeakMap<Element, { title: string; icon: Node | null }>();
  const timers = new WeakMap<Element, number>();
  const titleOf = (button: Element) => button.querySelector("p")?.textContent ?? "";
  // The icon slot comes first in the button (Fumadocs), holding the icon's frame (app/(docs)/layout.tsx mark)
  const iconOf = (button: Element) => button.firstElementChild?.firstElementChild ?? null;
  const keep = (button: Element) => shown.set(button, { title: titleOf(button), icon: iconOf(button)?.cloneNode(true) ?? null });
  // The stylesheet's minifier may write 250ms as .25s
  const ms = (name: string, fallback: number) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const amount = parseFloat(value);
    return Number.isNaN(amount) ? fallback : value.endsWith("ms") ? amount : amount * 1000;
  };
  const swap = (button: Element, old: { title: string; icon: Node | null }) => {
    const slot = button.firstElementChild as HTMLElement | null;
    const icon = iconOf(button) as HTMLElement | null;
    const title = button.querySelector<HTMLElement>("p");
    if (!slot || !icon || !title) return;
    // A swap still running gives way to this one
    button.querySelectorAll(".part-ghost").forEach((ghost) => ghost.remove());
    clearTimeout(timers.get(button));
    title.classList.remove("is-enter-start", "is-exit");

    if (old.icon instanceof HTMLElement) {
      const ghost = old.icon;
      ghost.classList.add("t-icon", "part-ghost");
      ghost.dataset.icon = "a";
      ghost.setAttribute("aria-hidden", "true");
      icon.classList.add("t-icon");
      icon.dataset.icon = "b";
      slot.classList.add("t-icon-swap");
      slot.append(ghost);
      // Both start where they stand, the old icon shown and the new one gone, then cross
      slot.dataset.state = "a";
      for (const one of [icon, ghost]) one.style.transition = "none";
      void slot.offsetWidth;
      for (const one of [icon, ghost]) one.style.removeProperty("transition");
      slot.dataset.state = "b";
      setTimeout(() => ghost.remove(), ms("--icon-swap-dur", 250));
    }

    const words = title.cloneNode(false) as HTMLElement;
    words.textContent = old.title;
    words.classList.add("t-text-swap", "part-ghost");
    words.setAttribute("aria-hidden", "true");
    title.classList.add("t-text-swap", "is-enter-start");
    title.after(words);
    void words.offsetHeight;
    words.classList.add("is-exit");
    timers.set(
      button,
      window.setTimeout(() => {
        words.remove();
        title.classList.remove("is-enter-start");
      }, ms("--text-swap-dur", 150)),
    );
  };
  document.querySelectorAll(PART_BUTTON).forEach(keep);
  const watch = new MutationObserver((records) => {
    const touched = new Set<Element>();
    for (const record of records) {
      const node = record.target.nodeType === Node.TEXT_NODE ? record.target.parentElement : (record.target as Element);
      const button = node?.closest?.(PART_BUTTON);
      if (button) touched.add(button);
      for (const added of record.addedNodes) if (added instanceof Element) added.querySelectorAll(PART_BUTTON).forEach((found) => touched.add(found));
    }
    for (const button of touched) {
      const old = shown.get(button);
      if (old && old.title !== titleOf(button) && !reduced()) swap(button, old);
      keep(button);
    }
  });
  watch.observe(document.body, { subtree: true, childList: true, characterData: true });
  return () => watch.disconnect();
}

/**
 * The main site's motion for what the docs share with it: no pull toward the pointer, no light, the system's cursor.
 * The theme's crossfade (M-21) is Fumadocs' own view transition, timed in the styles.
 */
export function Motion() {
  useEffect(() => {
    const stops = [installPressSpring(), installRipples(), installHeightTween(), installSidebarGlow(), installSidebarMark(), installCopySwap(), installMenus(), installTocTitle(), installPartSwap(), installStatusWords()];
    return () => stops.forEach((stop) => stop());
  }, []);
  return null;
}
