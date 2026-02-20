#!/usr/bin/env bun

import { findRepoRoot } from "./helpers/run_root.sh.ts";
import { runCommand, runCommandCapture } from "./helpers/run_command.sh.ts";

const repoRoot = findRepoRoot(import.meta.dir);

await runCommand(["bun", "scripts/ci.sh.ts"], { cwd: repoRoot });

let jsrVersion;
try {
  jsrVersion = await runCommandCapture(["jsr", "--version"], { cwd: repoRoot });
} catch {
  console.log("jsr CLI not found; skipping jsr publish dry run");
  process.exit(0);
}

if (jsrVersion.exitCode !== 0) {
  console.log("jsr CLI returned non-zero; skipping jsr publish dry run");
  process.exit(0);
}

await runCommand(["jsr", "publish", "--dry-run"], { cwd: repoRoot });
