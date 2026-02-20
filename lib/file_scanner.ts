import { existsSync, readdirSync } from "fs";
import { basename, dirname, join } from "path";
import type { ContentKind } from "./types.ts";

export class FileScanner {
  /// List files for one content kind under a root.
  listByKind(rootDir: string, kind: ContentKind): string[] {
    if (kind === "agent") return this.listMarkdownFiles(join(rootDir, "agent"));
    if (kind === "command") return this.listMarkdownFiles(join(rootDir, "command"));
    return this.listSkillFiles(rootDir);
  }

  /// List markdown files in one directory (non-recursive).
  listMarkdownFiles(directory: string): string[] {
    if (!existsSync(directory)) return [];

    const found = new Set<string>();
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".md")) continue;
      found.add(join(directory, entry.name));
    }

    return [...found].sort();
  }

  /// List OCX/OpenCode skill files at skills/<name>/SKILL.md.
  listSkillFiles(rootDir: string): string[] {
    const skillsDir = join(rootDir, "skills");
    if (!existsSync(skillsDir)) return [];

    const found = new Set<string>();
    for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillPath = join(skillsDir, entry.name, "SKILL.md");
      if (!existsSync(skillPath)) continue;
      found.add(skillPath);
    }

    return [...found].sort();
  }

  nameFromPath(filePath: string, kind: ContentKind): string {
    if (kind === "skill") return basename(dirname(filePath));

    return basename(filePath, ".md");
  }
}
