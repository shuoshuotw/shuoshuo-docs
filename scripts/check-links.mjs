// M6 exit: every internal link and anchor in the static export resolves, every error code has its anchor, and no proxy route shipped (SEC-18).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = "out";
const problems = [];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const decodeEntities = (text) => text.replaceAll("&amp;", "&").replaceAll("&quot;", '"');

const pages = new Map();
for (const file of walk(root)) {
  if (!file.endsWith(".html")) continue;
  const route = `/${relative(root, file).replaceAll("\\", "/").replace(/\.html$/, "").replace(/(^|\/)index$/, "")}`;
  const html = readFileSync(file, "utf8");
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => decodeEntities(match[1])));
  pages.set(route === "/" ? "/" : route.replace(/\/$/, ""), { file, html, ids });
}

if (pages.size === 0) problems.push("out/ has no pages: run the build first");

for (const [route, { html }] of pages) {
  for (const [, raw] of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const href = decodeEntities(raw);
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    const url = new URL(href, `https://docs.invalid${route}`);
    const path = decodeURIComponent(url.pathname).replace(/\/$/, "") || "/";
    const target = pages.get(path);
    if (!target) {
      problems.push(`${route}: broken link ${href}`);
      continue;
    }
    if (url.hash && !target.ids.has(decodeURIComponent(url.hash.slice(1)))) problems.push(`${route}: missing anchor ${href}`);
  }
}

// Every docs_url Core can send has to land somewhere
const errors = pages.get("/errors");
const codes = [...readFileSync("openapi/errors.yaml", "utf8").matchAll(/^([A-Z][A-Z_]+):$/gm)].map((match) => match[1]);
if (!errors) problems.push("/errors was not generated");
else for (const code of codes) if (!errors.ids.has(code)) problems.push(`/errors: no anchor for ${code}`);
if (codes.length === 0) problems.push("errors.yaml lists no codes");

// SEC-18: Fumadocs' proxy would forward Authorization (T-28)
const routes = [...walk("app")].map((file) => file.replaceAll("\\", "/"));
for (const file of routes) if (/proxy/i.test(file) || /createProxy/.test(readFileSync(file, "utf8"))) problems.push(`${file}: the docs site must not have a proxy route`);
if (existsSync("out/api/proxy")) problems.push("out/api/proxy exists");

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`${problems.length} problems`);
  process.exit(1);
}
console.log(`links ok: ${pages.size} pages, ${codes.length} error anchors`);
