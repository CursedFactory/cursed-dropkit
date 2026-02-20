import type {
  AgentDefinition,
  CommandDefinition,
  ContentKind,
  ContentSource,
  LoadDiagnostic,
  LoadedPluginizedContent,
  PluginizedDefinition,
  SkillDefinition,
} from "./types.ts";

export class DefinitionRegistry {
  agents: Record<string, AgentDefinition> = {};
  commands: Record<string, CommandDefinition> = {};
  skills: Record<string, SkillDefinition> = {};
  diagnostics: LoadDiagnostic[] = [];

  /// Merge one parsed definition with source precedence rules.
  add(kind: ContentKind, definition: PluginizedDefinition, filePath: string): void {
    if (kind === "agent") {
      this.mergeAgent(definition as AgentDefinition, filePath);
      return;
    }
    if (kind === "command") {
      this.mergeCommand(definition as CommandDefinition, filePath);
      return;
    }
    this.mergeSkill(definition as SkillDefinition, filePath);
  }

  snapshot(): LoadedPluginizedContent {
    return {
      agents: this.agents,
      commands: this.commands,
      skills: this.skills,
      diagnostics: this.diagnostics,
    };
  }

  mergeAgent(next: AgentDefinition, filePath: string): void {
    const current = this.agents[next.name];
    if (!current || this.shouldOverride(current.source, next.source)) {
      if (current) this.pushOverride("agent", next.name, next.source, current.source, filePath);
      this.agents[next.name] = next;
    }
  }

  mergeCommand(next: CommandDefinition, filePath: string): void {
    const current = this.commands[next.name];
    if (!current || this.shouldOverride(current.source, next.source)) {
      if (current) this.pushOverride("command", next.name, next.source, current.source, filePath);
      this.commands[next.name] = next;
    }
  }

  mergeSkill(next: SkillDefinition, filePath: string): void {
    const current = this.skills[next.name];
    if (!current || this.shouldOverride(current.source, next.source)) {
      if (current) this.pushOverride("skill", next.name, next.source, current.source, filePath);
      this.skills[next.name] = next;
    }
  }

  shouldOverride(current: ContentSource, next: ContentSource): boolean {
    return this.priority(next) >= this.priority(current);
  }

  priority(source: ContentSource): number {
    if (source === "plugin") return 0;
    if (source === "global") return 1;
    return 2;
  }

  pushOverride(kind: ContentKind, name: string, next: ContentSource, current: ContentSource, filePath: string): void {
    this.diagnostics.push({
      level: "warn",
      code: `${kind}_overridden`,
      message: `${this.capitalize(kind)} '${name}' from ${next} overrides ${current}`,
      filePath,
    });
  }

  capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
