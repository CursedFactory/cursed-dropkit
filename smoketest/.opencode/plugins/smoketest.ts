import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildScopedDirectories, createDropkitPlugin } from "../../../index.ts";

const pluginRootDir = dirname(fileURLToPath(import.meta.url));
const pluginDefaultsDir = join(pluginRootDir, "..", "..", "plugin");

export const SmokePlugin = createDropkitPlugin({
  service: "smoketest-plugin",
  summaryToolName: false,
  directories: (root) =>
    buildScopedDirectories({
      pluginRootDir: pluginDefaultsDir,
      root,
      namespace: "smoketest-plugin",
      includeGlobal: false,
      includeProject: false,
    }),
});
