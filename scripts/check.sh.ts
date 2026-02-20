#!/usr/bin/env bun

import { findRepoRoot } from "./helpers/run_root.sh.ts";
import { runCommand } from "./helpers/run_command.sh.ts";

const repoRoot = findRepoRoot(import.meta.dir);

await runCommand(["bun", "scripts/check_manifest.sh.ts"], { cwd: repoRoot });
await runCommand(["bun", "scripts/smoke_import.sh.ts"], { cwd: repoRoot });
