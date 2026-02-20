#!/usr/bin/env bun

import { findRepoRoot } from "./helpers/run_root.sh.ts";
import { runCommand } from "./helpers/run_command.sh.ts";

const repoRoot = findRepoRoot(import.meta.dir);

await runCommand(["npm", "install", "--no-save", "@opencode-ai/plugin"], { cwd: repoRoot });
await runCommand(["npm", "install", "--prefix", "smoketest"], { cwd: repoRoot });
await runCommand(["node", "smoketest/run_smoke.mjs"], { cwd: repoRoot });
