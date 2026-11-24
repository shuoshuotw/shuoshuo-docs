"use client";

import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";

/** Fumadocs' light and dark switch at the foot of the folded sidebar's rail (styles: .rail-theme). */
export function RailTheme() {
  return (
    <div className="rail-theme">
      <ThemeSwitch />
    </div>
  );
}
