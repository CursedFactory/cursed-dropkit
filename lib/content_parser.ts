import { readFileSync } from "fs";
import { parseFrontmatter } from "./frontmatter.ts";
import { FileScanner } from "./file_scanner.ts";
import type {
  AgentDefinition,
  CommandDefinition,
  ContentKind,
  ContentSource,
  LoadDiagnostic,
  PluginizedDefinition,
} from "./types.ts";

export interface ParseResult {
  definition?: PluginizedDefinition;
  diagnostics: LoadDiagnostic[];
}

export class ContentParser {
  scanner = new FileScanner();

  /// Parse one file and validate required fields for its kind.
  parseFile(kind: ContentKind, filePath: string, source: ContentSource): ParseResult {
    const diagnostics: LoadDiagnostic[] = [];

    try {
      const raw = readFileSync(filePath, "utf-8");
      const { data, body } = parseFrontmatter(raw);
      const stem = this.scanner.nameFromPath(filePath, kind);
      return this.parseByKind(kind, stem, data, body, filePath, source, diagnostics);
    } catch (error: any) {
      diagnostics.push({
        level: "error",
        code: `${kind}_parse_failed`,
        message: `${this.capitalize(kind)} skipped: ${error?.message ?? String(error)}`,
        filePath,
      });
      return { diagnostics };
    }
  }

  parseByKind(
    kind: ContentKind,
    stem: string,
    data: Record<string, unknown>,
    body: string,
    filePath: string,
    source: ContentSource,
    diagnostics: LoadDiagnostic[],
  ): ParseResult {
    if (kind === "agent") {
      return this.parseAgent(stem, data, body, filePath, source, diagnostics);
    }

    if (kind === "command") {
      return this.parseCommand(stem, data, body, filePath, source, diagnostics);
    }

    return this.parseSkill(stem, data, body, filePath, source, diagnostics);
  }

  parseAgent(
    stem: string,
    data: Record<string, unknown>,
    body: string,
    filePath: string,
    source: ContentSource,
    diagnostics: LoadDiagnostic[],
  ): ParseResult {
    const description = typeof data.description === "string" ? data.description.trim() : "";
    if (!description) {
      diagnostics.push(this.warn("agent_missing_description", "Agent skipped: missing 'description'", filePath));
      return { diagnostics };
    }

    const definition: AgentDefinition = {
      name: stem,
      description,
      body: body.trim(),
      frontmatter: data,
      filePath,
      source,
    };

    return { definition, diagnostics };
  }

  parseCommand(
    stem: string,
    data: Record<string, unknown>,
    body: string,
    filePath: string,
    source: ContentSource,
    diagnostics: LoadDiagnostic[],
  ): ParseResult {
    const template = body.trim();
    if (!template) {
      diagnostics.push(this.warn("command_missing_template", "Command skipped: empty template body", filePath));
      return { diagnostics };
    }

    const definition: CommandDefinition = {
      name: stem,
      description: typeof data.description === "string" ? data.description.trim() : undefined,
      template,
      frontmatter: data,
      filePath,
      source,
    };

    return { definition, diagnostics };
  }

  parseSkill(
    stem: string,
    data: Record<string, unknown>,
    body: string,
    filePath: string,
    source: ContentSource,
    diagnostics: LoadDiagnostic[],
  ): ParseResult {
    const skillName = typeof data.name === "string" ? data.name.trim() : "";
    const description = typeof data.description === "string" ? data.description.trim() : "";

    if (!skillName || !description) {
      diagnostics.push(this.warn("skill_missing_required_fields", "Skill skipped: missing 'name' or 'description'", filePath));
      return { diagnostics };
    }

    if (skillName !== stem) {
      diagnostics.push(
        this.warn(
          "skill_name_mismatch",
          `Skill skipped: frontmatter name '${skillName}' must match filename '${stem}'`,
          filePath,
        ),
      );
      return { diagnostics };
    }

    return {
      definition: {
        name: skillName,
        description,
        content: body.trim(),
        frontmatter: data,
        filePath,
        source,
      },
      diagnostics,
    };
  }

  warn(code: string, message: string, filePath: string): LoadDiagnostic {
    return { level: "warn", code, message, filePath };
  }

  capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
