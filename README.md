# cursed-dropkit

Reusable dropkit library for OpenCode plugins.

This repository is the shared runtime and loader package (not a plugin template and not a plugin with bundled assets).

## Version

- `0.0.1`

## Package layout

- `index.ts` - root exports
- `lib/` - core loader, parser, merge logic, and plugin factory helpers

## Install

Current primary path is git dependency:

```bash
npm i github:cursed/cursed-dropkit
```

or with bun:

```bash
bun add github:cursed/cursed-dropkit
```

Prepared for package registries:

- npm metadata: `package.json`
- JSR metadata: `jsr.json`

Peer dependency expected in consumer projects:

- `@opencode-ai/plugin`

## Helper scripts

- `bun run check` - validate manifests + smoke imports
- `bun run test` - smoke imports
- `bun run build` - npm pack dry run
- `bun run ci` - check + test + build
- `bun run smoketest` - run end-to-end opencode smoke test (requires `OPENROUTER_API_KEY`)
- `bun run smoketest:container` - run end-to-end smoke test in Docker
- `bun run version:set -- 0.0.2` - bump `package.json` and `jsr.json` together
- `bun run publish:npm:dry-run` - run npm publish dry run
- `bun run release:dry-run` - ci plus optional `jsr publish --dry-run` if `jsr` CLI is installed

## End-to-end smoketest

This repo includes an end-to-end OpenCode smoketest under `smoketest/`:

- Loads an example dropkit plugin at `smoketest/example-dropkit-command/plugin.ts`
- Provides a command fixture at `smoketest/example-dropkit-command/command/ping.md`
- Runs the OpenCode harness from `smoketest/harness/`
- Executes `opencode run --command ping ci-arg`
- Verifies output contains `SMOKETEST_PLUGIN_COMMAND_MARKER::ci-arg`

Local run:

```bash
export OPENROUTER_API_KEY=...
bun run smoketest
```

Container run:

```bash
export OPENROUTER_API_KEY=...
bun run smoketest:container
```

CI workflow is defined at `.github/workflows/smoketest.yml` and runs when `OPENROUTER_API_KEY` secret is configured.

## Use in a plugin

```ts
import { dirname } from "path";
import { fileURLToPath } from "url";
import { buildScopedDirectories, createDropkitPlugin } from "cursed-dropkit";

const pluginRootDir = dirname(fileURLToPath(import.meta.url));

export const MyPlugin = createDropkitPlugin({
  service: "my-plugin",
  directories: (root) =>
    buildScopedDirectories({
      pluginRootDir,
      root,
      namespace: "my-plugin",
    }),
});
```
