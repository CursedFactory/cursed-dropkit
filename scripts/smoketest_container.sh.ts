#!/usr/bin/env bun

import { findRepoRoot } from "./helpers/run_root.sh.ts";
import { runCommand } from "./helpers/run_command.sh.ts";

const repoRoot = findRepoRoot(import.meta.dir);
const image = process.env.SMOKETEST_IMAGE || "cursed-dropkit-smoketest:local";
const model = process.env.SMOKETEST_MODEL || "openrouter/x-ai/grok-4.1-fast";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("Missing OPENROUTER_API_KEY for smoketest container run");
}

await runCommand(["docker", "build", "-f", "smoketest/Dockerfile", "-t", image, "."], {
  cwd: repoRoot,
});

await runCommand(
  [
    "docker",
    "run",
    "--rm",
    "-e",
    `OPENROUTER_API_KEY=${process.env.OPENROUTER_API_KEY}`,
    "-e",
    `SMOKETEST_MODEL=${model}`,
    image,
  ],
  { cwd: repoRoot },
);
