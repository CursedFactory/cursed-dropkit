#!/usr/bin/env bun

import { findRepoRoot } from "./helpers/run_root.sh.ts";

const repoRoot = findRepoRoot(import.meta.dir);

const versionArg = Bun.argv[2];

if (!versionArg || versionArg === "--help" || versionArg === "-h") {
  console.log("Usage: bun scripts/version.sh.ts <semver>");
  console.log("Example: bun scripts/version.sh.ts 0.0.2");
  process.exit(versionArg ? 0 : 1);
}

if (!/^\d+\.\d+\.\d+$/.test(versionArg)) {
  throw new Error(`Invalid version '${versionArg}'. Expected semver like 0.0.2`);
}

const packageJsonPath = `${repoRoot}/package.json`;
const jsrJsonPath = `${repoRoot}/jsr.json`;

const packageJson = await Bun.file(packageJsonPath).json();
const jsrJson = await Bun.file(jsrJsonPath).json();

const previousPackageVersion = String(packageJson.version ?? "");
const previousJsrVersion = String(jsrJson.version ?? "");

packageJson.version = versionArg;
jsrJson.version = versionArg;

await Bun.write(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
await Bun.write(jsrJsonPath, `${JSON.stringify(jsrJson, null, 2)}\n`);

console.log(`Updated version to ${versionArg}`);
console.log(`- package.json: ${previousPackageVersion} -> ${versionArg}`);
console.log(`- jsr.json: ${previousJsrVersion} -> ${versionArg}`);
