/** The site's mark (shuoshuo-client components/logo.tsx): two right-angle brackets and the two red strokes. */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg className="logo" viewBox="14 14 92 92" width={size} height={size} aria-hidden="true">
      <g fill="none" strokeWidth="12" strokeLinecap="butt" strokeLinejoin="miter" stroke="currentColor">
        <path d="M20 26H94V48" />
        <path d="M26 72V94H100" />
      </g>
      <g fill="none" strokeWidth="12" strokeLinecap="butt" stroke="var(--brand-red)">
        <path className="logo-stroke" pathLength={1} d="M50 40V64" />
        <path className="logo-stroke" pathLength={1} d="M70 40V80" />
      </g>
    </svg>
  );
}

/** One corner of the frame around a quote: ┌ opens it, ┘ closes it. */
export function Bracket({ end = false }: { end?: boolean }) {
  return (
    <svg className={end ? "bracket bracket-close" : "bracket bracket-open"} viewBox="0 0 40 40" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="butt" strokeLinejoin="miter" d={end ? "M37.5 2V37.5H2" : "M2.5 38V2.5H38"} />
    </svg>
  );
}

// GitHub's mark from Simple Icons (CC0), since lucide-react no longer ships brand marks
export function GitHubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
