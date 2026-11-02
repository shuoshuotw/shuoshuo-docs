import { loader } from "fumadocs-core/source";
import { defineDocs } from "fumadocs-mdx/macro";
import { openapi } from "./openapi";

const docs = defineDocs({ dir: "content/docs" });

export const source = loader({
  // Root, not /docs: Core's docs_url points at docs.shuoshuotw.xyz/errors#CODE
  baseUrl: "/",
  source: docs.toFumadocsSource(),
  plugins: [openapi.loaderPlugin()],
});
