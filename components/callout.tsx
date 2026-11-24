import { CircleCheck, CircleX, Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

const ICONS = { info: Info, warning: TriangleAlert, error: CircleX, success: CircleCheck, idea: Lightbulb };

type Kind = keyof typeof ICONS;

/**
 * Fumadocs' Callout, in the docs' own design: no rule at the card's edge, but a lamp of the callout's colour at its
 * icon, lighting the card from there (styles: .callout). Takes Fumadocs' types, `warn` and `tip` included.
 */
export function Callout({ type = "info", title, children }: { type?: Kind | "warn" | "tip"; title?: ReactNode; children?: ReactNode }) {
  const kind: Kind = type === "warn" ? "warning" : type === "tip" ? "info" : type;
  const Icon = ICONS[kind];
  return (
    <div className="callout" data-type={kind}>
      <span className="callout-icon" aria-hidden="true">
        <Icon />
      </span>
      <div className="callout-body">
        {title && <p className="callout-title">{title}</p>}
        <div className="callout-text prose-no-margin">{children}</div>
      </div>
    </div>
  );
}
