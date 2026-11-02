import { generateFiles } from "fumadocs-openapi";
import { createOpenAPI } from "fumadocs-openapi/server";

await generateFiles({
  input: createOpenAPI({ input: ["./openapi/openapi.yaml"] }),
  output: "./content/docs/api",
  includeDescription: true,
});
