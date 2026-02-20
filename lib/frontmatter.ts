export interface FrontmatterResult {
  data: Record<string, unknown>;
  body: string;
  hasFrontmatter: boolean;
}

class FrontmatterParser {
  // Match standard YAML frontmatter at file start and capture remaining markdown body.
  // Uses [\s\S] so multi-line content is captured without relying on dotall flags.
  frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

  /// Parse markdown frontmatter into data/body split.
  parse(content: string): FrontmatterResult {
    const match = content.match(this.frontmatterRegex);

    if (!match) {
      return {
        data: {},
        body: content,
        hasFrontmatter: false,
      };
    }

    const yamlContent = match[1];
    const body = match[2] ?? "";
    const parsed = this.parseTopLevelYaml(yamlContent);

    return {
      data: parsed,
      body,
      hasFrontmatter: true,
    };
  }

  /// Parse a small YAML subset (top-level key/value pairs) for readability-first configs.
  parseTopLevelYaml(yamlContent: string): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    let activeObjectKey: string | undefined;

    // Split on both Unix and Windows newlines while preserving readable line iteration.
    for (const rawLine of yamlContent.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const isIndented = rawLine.startsWith(" ") || rawLine.startsWith("\t");
      if (isIndented && activeObjectKey && this.isRecord(out[activeObjectKey])) {
        const child = this.parseKeyValue(line);
        if (!child) continue;
        (out[activeObjectKey] as Record<string, unknown>)[child.key] = this.parseScalar(child.value);
        continue;
      }

      const topLevel = this.parseKeyValue(line);
      if (!topLevel) continue;

      if (!topLevel.value) {
        out[topLevel.key] = {};
        activeObjectKey = topLevel.key;
        continue;
      }

      out[topLevel.key] = this.parseScalar(topLevel.value);
      activeObjectKey = undefined;
    }

    return out;
  }

  parseKeyValue(line: string): { key: string; value: string } | undefined {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) return undefined;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key) return undefined;

    return { key, value };
  }

  parseScalar(value: string): unknown {
    if (!value) return "";
    if (value === "true") return true;
    if (value === "false") return false;
    // Match plain integer/decimal numeric scalars so we can coerce simple YAML numbers.
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    return value;
  }

  isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
}

/// Shared helper for parsing markdown with YAML frontmatter.
export function parseFrontmatter(content: string): FrontmatterResult {
  const parser = new FrontmatterParser();
  return parser.parse(content);
}
