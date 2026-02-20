#!/usr/bin/env bun

import { findRepoRoot } from "./helpers/run_root.sh.ts";
import { runCommand } from "./helpers/run_command.sh.ts";

const repoRoot = findRepoRoot(import.meta.dir);

await runCommand(["bun", "scripts/check.sh.ts"], { cwd: repoRoot });
await runCommand(["bun", "scripts/test.sh.ts"], { cwd: repoRoot });
await runCommand(["bun", "scripts/build.sh.ts"], { cwd: repoRoot });
