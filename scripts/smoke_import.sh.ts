#!/usr/bin/env bun

import { findRepoRoot } from "./helpers/run_root.sh.ts";

const repoRoot = findRepoRoot(import.meta.dir);
const frontmatter = await import(`${repoRoot}/lib/frontmatter.ts`);
const loader = await import(`${repoRoot}/lib/load.ts`);

if (!("parseFrontmatter" in frontmatter)) {
  throw new Error("Missing export: parseFrontmatter");
}

if (!("loadPluginizedContent" in loader)) {
  throw new Error("Missing export: loadPluginizedContent");
}

console.log("Smoke import passed");
