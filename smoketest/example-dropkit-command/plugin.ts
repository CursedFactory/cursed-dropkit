import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildScopedDirectories, createDropkitPlugin } from "../../index.ts";

const pluginRootDir = dirname(fileURLToPath(import.meta.url));

export const ExampleDropkitCommandPlugin = createDropkitPlugin({
  service: "example-dropkit-command",
  summaryToolName: false,
  directories: (root) =>
    buildScopedDirectories({
      pluginRootDir,
      root,
      namespace: "example-dropkit-command",
      includeGlobal: false,
      includeProject: false,
    }),
});
