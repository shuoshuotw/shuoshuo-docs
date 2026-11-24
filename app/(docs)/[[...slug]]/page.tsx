import { findNeighbour } from "fumadocs-core/page-tree";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentProps } from "react";
import { OpenAPIPage, OpenAPIPageNoPlayground } from "@/components/api-page";
import { Callout } from "@/components/callout";
import { Pager } from "@/components/pager";
import { TocDone } from "@/components/toc-done";
import { openapi } from "@/lib/openapi";
import { source } from "@/lib/source";

type Props = { params: Promise<{ slug?: string[] }> };

type Operation = { path: string; method: string };

// §14.1: a browser may call these only from the main site (CORS), so the Playground here cannot; an API Key from a
// server can, as every endpoint these pages list
const isPrivate = ({ path }: Operation) => path.startsWith("/v1/me");

function PlaygroundNote({ operations }: { operations: Operation[] }) {
  if (operations.some(isPrivate)) {
    return <Callout type="info">這個端點可以用 API Key 呼叫，但瀏覽器只允許從主站呼叫，所以文件站的 Playground 無法試用。請從你的伺服器執行範例中的 curl 指令。</Callout>;
  }
  if (operations.some(({ method }) => method.toLowerCase() !== "get")) {
    return <Callout type="warn">在 Playground 送出寫入請求會動到真實資料。</Callout>;
  }
  return null;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;
  return (
    // A page of its own on each path, so its entrance (styles: #nd-page) plays again on every change of page
    <DocsPage
      key={page.url}
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ footer: <TocDone /> }}
      footer={{ component: <Pager {...findNeighbour(source.getPageTree(), page.url)} /> }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={{
            ...defaultMdxComponents,
            Callout,
            OpenAPIPage: async (mdxProps: ComponentProps<typeof OpenAPIPage>) => {
              const operations = (mdxProps as { operations?: Operation[] }).operations ?? [];
              const Render = operations.some(isPrivate) ? OpenAPIPageNoPlayground : OpenAPIPage;
              return (
                <>
                  <PlaygroundNote operations={operations} />
                  <Render {...(await openapi.preloadOpenAPIPage(page))} {...mdxProps} />
                </>
              );
            },
          }}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = source.getPage((await params).slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}
