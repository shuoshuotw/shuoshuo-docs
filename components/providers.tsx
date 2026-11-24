"use client";

import type { i18nProvider } from "fumadocs-ui/i18n";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Command } from "lucide-react";
import { type ReactNode, useSyncExternalStore } from "react";

const noop = () => () => {};

/** The key the search shortcut is held with, drawn as the ⌘ icon everywhere; a screen reader still hears Ctrl on Windows and Linux. */
function ModifierKey() {
  const control = useSyncExternalStore(noop, () => /Windows|Linux/i.test(navigator.userAgent), () => false);
  return (
    <>
      <Command className="size-3.5" aria-hidden="true" />
      <span className="sr-only">{control ? "Ctrl" : "Command"}</span>
    </>
  );
}

// Fumadocs' own shortcut (⌘ or Ctrl with K), shown with an icon for the held key instead of its name
const HOT_KEY = [
  { key: (event: KeyboardEvent) => event.metaKey || event.ctrlKey, display: <ModifierKey /> },
  { key: "k", display: "K" },
];

export function Providers({ i18n, children }: { i18n: ReturnType<typeof i18nProvider>; children: ReactNode }) {
  return (
    <RootProvider i18n={i18n} search={{ options: { type: "static" }, hotKey: HOT_KEY }}>
      {children}
    </RootProvider>
  );
}
