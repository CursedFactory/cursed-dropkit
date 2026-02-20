#!/usr/bin/env bun

import { findRepoRoot } from "./helpers/run_root.sh.ts";

const repoRoot = findRepoRoot(import.meta.dir);
const packageJsonPath = `${repoRoot}/package.json`;
const jsrJsonPath = `${repoRoot}/jsr.json`;

const packageJson = await Bun.file(packageJsonPath).json();
const jsrJson = await Bun.file(jsrJsonPath).json();

if (packageJson.version !== jsrJson.version) {
  throw new Error(`Version mismatch: package.json=${packageJson.version} jsr.json=${jsrJson.version}`);
}

if (packageJson.exports?.["."] !== "./index.ts") {
  throw new Error(`Unexpected package.json exports['.']: ${String(packageJson.exports?.["."])}`);
}

if (jsrJson.exports?.["."] !== "./index.ts") {
  throw new Error(`Unexpected jsr.json exports['.']: ${String(jsrJson.exports?.["."])}`);
}

console.log("Manifest check passed");
