export type ContentKind = "agent" | "command" | "skill";

export type ContentSource = "plugin" | "global" | "project";

export interface LoadDiagnostic {
  level: "warn" | "error";
  code: string;
  message: string;
  filePath?: string;
}

export interface AgentDefinition {
  name: string;
  description: string;
  body: string;
  frontmatter: Record<string, unknown>;
  filePath: string;
  source: ContentSource;
}

export interface CommandDefinition {
  name: string;
  description?: string;
  template: string;
  frontmatter: Record<string, unknown>;
  filePath: string;
  source: ContentSource;
}

export interface SkillDefinition {
  name: string;
  description: string;
  content: string;
  frontmatter: Record<string, unknown>;
  filePath: string;
  source: ContentSource;
}

export type PluginizedDefinition = AgentDefinition | CommandDefinition | SkillDefinition;

export interface LoadedPluginizedContent {
  agents: Record<string, AgentDefinition>;
  commands: Record<string, CommandDefinition>;
  skills: Record<string, SkillDefinition>;
  diagnostics: LoadDiagnostic[];
}

export interface SourceDirectory {
  source: ContentSource;
  rootDir: string;
}

export interface LoadPluginizedContentOptions {
  directories: SourceDirectory[];
}
