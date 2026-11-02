// D-09: copies the contract from the sibling shuoshuo-core. Commit the result; API pages are generated at build.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("openapi", { recursive: true });
copyFileSync("../shuoshuo-core/openapi/openapi.yaml", "openapi/openapi.yaml");
copyFileSync("../shuoshuo-core/openapi/errors.yaml", "openapi/errors.yaml");
