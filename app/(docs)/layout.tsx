import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { type Folder, flattenTree, type Node, type Root } from "fumadocs-core/page-tree";
import { BookOpenText, Braces, House, Rocket } from "lucide-react";
import type { ReactNode } from "react";
import { GitHubIcon, Logo } from "@/components/marks";
import { PageTurn } from "@/components/page-turn";
import { RailTheme } from "@/components/rail-theme";
import { source } from "@/lib/source";

/**
 * The API reference's tags fold: each tag's separator and the pages under it become a folder of the sidebar, open to
 * begin with. Only the sidebar's grouping changes; the pages keep their flat URLs (scripts/generate-api-docs.ts).
 */
function foldTags(tree: Root): Root {
  const children: Node[] = [];
  const tags = new Set<Folder>();
  for (const node of tree.children) {
    const last = children.at(-1);
    if (node.type === "page" && node.url.startsWith("/api/") && last?.type === "separator") {
      const tag: Folder = { type: "folder", name: last.name, collapsible: true, defaultOpen: true, children: [node] };
      tags.add(tag);
      children[children.length - 1] = tag;
    } else if (node.type === "page" && last?.type === "folder" && tags.has(last)) last.children.push(node);
    else children.push(node);
  }
  return { ...tree, children };
}

// The menu over the search box: the docs' three parts, each opened at its first page and marked while one of its
// pages is shown. The sidebar keeps listing all of them
// Each icon in the box Fumadocs gives a folder's own (its defaultTransform): bare on the desk, on a small tile on a phone
const mark = (icon: ReactNode) => <div className="size-full [&_svg]:size-full max-md:rounded-md max-md:border max-md:bg-fd-secondary max-md:p-1.5">{icon}</div>;

const PARTS = [
  { title: "開始使用", description: "上手、認證、限流與錯誤", icon: mark(<Rocket className="text-fd-primary" />), of: (url: string) => !url.startsWith("/concepts/") && !url.startsWith("/api/") },
  { title: "共用規範", description: "回應格式、分頁與類別", icon: mark(<BookOpenText className="text-sky-500" />), of: (url: string) => url.startsWith("/concepts/") },
  { title: "API 參考", description: "API Key 能呼叫的每個端點", icon: mark(<Braces className="text-emerald-500" />), of: (url: string) => url.startsWith("/api/") },
];

export default function Layout({ children }: { children: ReactNode }) {
  const tree = foldTags(source.getPageTree());
  const order = flattenTree(tree.children).map(({ url }) => url);
  const tabs = PARTS.map(({ of, ...part }) => {
    const urls = order.filter(of);
    return { ...part, url: urls[0]!, urls: new Set(urls) };
  });
  return (
    <DocsLayout
      tree={tree}
      tabs={tabs}
      nav={{
        title: (
          <span className="docs-wordmark">
            <Logo />
            <span className="docs-wordmark-text">說說開發者中心</span>
          </span>
        ),
      }}
      links={[
        { type: "icon", text: "說說主站", label: "說說主站", url: "https://shuoshuotw.xyz", external: true, icon: <House /> },
        {
          type: "icon",
          text: "GitHub",
          label: "GitHub：ShuoShuo",
          url: "https://github.com/shuoshuotw",
          external: true,
          icon: (
            <span className="docs-github">
              <GitHubIcon />
              ShuoShuo
            </span>
          ),
        },
      ]}
    >
      {children}
      <PageTurn order={order} />
      <RailTheme />
    </DocsLayout>
  );
}
