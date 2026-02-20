import { existsSync, readdirSync } from "fs";
import { basename, extname, join } from "path";
import type { ContentKind } from "./types.ts";

export class FileScanner {
  /// List files for one content kind under a root.
  listByKind(rootDir: string, kind: ContentKind): string[] {
    const candidates = [join(rootDir, `${kind}s`), join(rootDir, "assets"), join(rootDir, "assets", `${kind}s`)];

    const found = new Set<string>();
    for (const folder of candidates) {
      if (!existsSync(folder)) continue;

      for (const entry of readdirSync(folder, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        const filePath = join(folder, entry.name);
        if (!this.matchesKindFile(filePath, kind)) continue;
        found.add(filePath);
      }
    }

    return [...found].sort();
  }

  suffixForKind(kind: ContentKind): string {
    if (kind === "agent") return ".agent.md";
    if (kind === "command") return ".cmd.md";
    return ".skill.md";
  }

  matchesKindFile(filePath: string, kind: ContentKind): boolean {
    const fileName = basename(filePath);
    if (fileName.endsWith(this.suffixForKind(kind))) return true;

    // Allow legacy shorthand in kind folders: agents/<name>.md, commands/<name>.md, skills/<name>.md
    const parentName = basename(join(filePath, ".."));
    return parentName === `${kind}s` && fileName.endsWith(".md");
  }

  nameFromPath(filePath: string, kind: ContentKind): string {
    const fileName = basename(filePath);
    const suffix = this.suffixForKind(kind);
    if (fileName.endsWith(suffix)) {
      return basename(filePath, suffix);
    }

    if (fileName.endsWith(".md")) {
      return basename(filePath, ".md");
    }

    return basename(filePath, extname(filePath));
  }
}
