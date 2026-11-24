"use client";

import { createShikiHighlighter } from "fumadocs-core/highlight/shiki";
import { defaultShikiFactory } from "fumadocs-core/highlight/shiki/full";
import { createOpenAPIPage } from "fumadocs-openapi/ui";
import { createDynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock.core";
import { type ComponentProps, useDeferredValue } from "react";

// fumadocs-openapi's own code block (its defaults: Shiki's GitHub themes, coloured by CSS variables)
const Highlighted = createDynamicCodeBlock({
  highlighter: createShikiHighlighter(() => defaultShikiFactory.getOrInit(), { defaultColor: false, themes: { light: "github-light", dark: "github-dark" } }),
});

/**
 * An example switched to another language keeps the code it shows until the new one is coloured. Rendered at once, the
 * language still loading put up its plain text first (Suspense's stand-in) and flashed into colour a moment later.
 */
function CodeBlock(props: ComponentProps<typeof Highlighted>) {
  const lang = useDeferredValue(props.lang);
  const code = useDeferredValue(props.code);
  return <Highlighted {...props} lang={lang} code={code} />;
}

export const OpenAPIPage = createOpenAPIPage({ components: { CodeBlock } });

// §14.1: /v1/me only accepts the main site's origin, so a Send button here could only ever fail
export const OpenAPIPageNoPlayground = createOpenAPIPage({ playground: { enabled: false }, components: { CodeBlock } });
