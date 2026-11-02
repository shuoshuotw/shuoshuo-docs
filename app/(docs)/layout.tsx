import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      nav={{ title: <span className="docs-wordmark">說說 API</span> }}
      links={[
        { text: "主站", url: "https://shuoshuotw.xyz", external: true },
        { text: "GitHub", url: "https://github.com/shuoshuotw", external: true },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
