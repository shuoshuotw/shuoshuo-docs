import { Callout } from "fumadocs-ui/components/callout";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentProps } from "react";
import { OpenAPIPage, OpenAPIPageNoPlayground } from "@/components/api-page";
import { openapi } from "@/lib/openapi";
import { source } from "@/lib/source";

type Props = { params: Promise<{ slug?: string[] }> };

type Operation = { path: string; method: string };

// §14.1: these only answer the main site, or the internal HMAC
const isPrivate = ({ path }: Operation) => path.startsWith("/v1/me") || path.startsWith("/v1/admin") || path === "/v1/health/ready";

function PlaygroundNote({ operations }: { operations: Operation[] }) {
  if (operations.some(isPrivate)) {
    return <Callout type="info">這個端點只接受主站來源或內部憑證，無法在文檔站試用，請用範例中的 curl 指令。</Callout>;
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
    <DocsPage toc={page.data.toc} full={page.data.full}>
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
