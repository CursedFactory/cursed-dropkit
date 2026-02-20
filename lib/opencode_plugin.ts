import { homedir } from "os";
import { join } from "path";
import { tool, type Plugin } from "@opencode-ai/plugin";
import { loadPluginizedContent } from "./load.ts";
import type {
  AgentDefinition,
  CommandDefinition,
  LoadedPluginizedContent,
  SkillDefinition,
  SourceDirectory,
} from "./types.ts";

export type BuildScopedDirectoriesOptions = {
  pluginRootDir: string;
  root: string;
  namespace: string;
  includeGlobal?: boolean;
  includeProject?: boolean;
};

export type DropkitPluginFactoryOptions = {
  service: string;
  directories: (root: string) => SourceDirectory[];
  summaryToolName?: string | false;
};

/// Build plugin/global/project roots for one scoped dropkit plugin.
export function buildScopedDirectories(options: BuildScopedDirectoriesOptions): SourceDirectory[] {
  const directories: SourceDirectory[] = [
    {
      source: "plugin",
      rootDir: options.pluginRootDir,
    },
  ];

  if (options.includeGlobal ?? true) {
    directories.push({
      source: "global",
      rootDir: join(homedir(), ".config", "opencode", options.namespace),
    });
  }

  if (options.includeProject ?? true) {
    directories.push({
      source: "project",
      rootDir: join(options.root, ".opencode", options.namespace),
    });
  }

  return directories;
}

class DropkitConfigRuntime {
  /// Build a compact summary payload for logs/tools.
  summary(loaded: LoadedPluginizedContent): Record<string, unknown> {
    return {
      counts: {
        agents: Object.keys(loaded.agents).length,
        commands: Object.keys(loaded.commands).length,
        skills: Object.keys(loaded.skills).length,
        diagnostics: loaded.diagnostics.length,
      },
      agents: Object.keys(loaded.agents),
      commands: Object.keys(loaded.commands),
      skills: Object.keys(loaded.skills),
      diagnostics: loaded.diagnostics,
    };
  }

  /// Merge dropkit content into OpenCode runtime config.
  applyConfig(config: Record<string, unknown>, loaded: LoadedPluginizedContent): void {
    const currentAgents = this.asRecord(config.agent);
    const currentCommands = this.asRecord(config.command);

    const dropkitAgents: Record<string, unknown> = {};
    for (const [name, definition] of Object.entries(loaded.agents)) {
      dropkitAgents[name] = this.toAgentConfig(definition);
    }

    const dropkitCommands: Record<string, unknown> = {};
    for (const [name, definition] of Object.entries(loaded.commands)) {
      dropkitCommands[name] = this.toCommandConfig(definition);
    }
    for (const [name, definition] of Object.entries(loaded.skills)) {
      dropkitCommands[name] = this.toSkillCommandConfig(definition);
    }

    // Keep existing system/project config highest at merge time.
    config.agent = { ...dropkitAgents, ...currentAgents };
    config.command = { ...dropkitCommands, ...currentCommands };
  }

  /// Convert dropkit agent markdown definition into OpenCode agent config.
  toAgentConfig(definition: AgentDefinition): Record<string, unknown> {
    const frontmatter = this.asRecord(definition.frontmatter);

    return {
      description: definition.description,
      mode: typeof frontmatter.mode === "string" ? frontmatter.mode : "subagent",
      prompt: definition.body,
      ...(typeof frontmatter.model === "string" ? { model: frontmatter.model } : {}),
      ...(typeof frontmatter.temperature === "number" ? { temperature: frontmatter.temperature } : {}),
      ...(typeof frontmatter.permission === "string" ? { permission: frontmatter.permission } : {}),
      ...(typeof frontmatter.hidden === "boolean" ? { hidden: frontmatter.hidden } : {}),
      ...(typeof frontmatter.color === "string" ? { color: frontmatter.color } : {}),
      ...(typeof frontmatter.top_p === "number" ? { top_p: frontmatter.top_p } : {}),
      ...(this.isRecord(frontmatter.tools) ? { tools: frontmatter.tools } : {}),
      ...(this.isRecord(frontmatter.steps) ? { steps: frontmatter.steps } : {}),
    };
  }

  /// Convert dropkit command markdown definition into OpenCode command config.
  toCommandConfig(definition: CommandDefinition): Record<string, unknown> {
    const frontmatter = this.asRecord(definition.frontmatter);

    return {
      description: definition.description ?? "",
      template: definition.template,
      ...(typeof frontmatter.agent === "string" ? { agent: frontmatter.agent } : {}),
      ...(typeof frontmatter.model === "string" ? { model: frontmatter.model } : {}),
      ...(typeof frontmatter.subtask === "boolean" ? { subtask: frontmatter.subtask } : {}),
    };
  }

  /// Convert dropkit skill markdown definition into an executable OpenCode command.
  toSkillCommandConfig(definition: SkillDefinition): Record<string, unknown> {
    return {
      description: definition.description,
      template: `<skill-instruction>\n${definition.content}\n</skill-instruction>\n\n<user-request>\n$ARGUMENTS\n</user-request>`,
    };
  }

  asRecord(value: unknown): Record<string, unknown> {
    if (this.isRecord(value)) return value;
    return {};
  }

  isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
}

/// Build a project/global/plugin merged dropkit plugin.
export function createDropkitPlugin(options: DropkitPluginFactoryOptions): Plugin {
  return async ({ client, directory, worktree }) => {
    const runtime = new DropkitConfigRuntime();
    const root = worktree || directory;
    const loaded = loadPluginizedContent({ directories: options.directories(root) });
    const summaryToolName = options.summaryToolName === false ? undefined : options.summaryToolName ?? `${options.service}_summary`;

    return {
      config: async (config) => {
        runtime.applyConfig(config as Record<string, unknown>, loaded);
      },
      event: async ({ event }) => {
        if (event.type !== "session.created") return;

        await client.app.log({
          body: {
            service: options.service,
            level: "info",
            message: `${options.service} content loaded`,
            extra: runtime.summary(loaded),
          },
        });
      },
      ...(summaryToolName
        ? {
            tool: {
              [summaryToolName]: tool({
                description: `Show ${options.service} content load summary`,
                args: {},
                /// Return JSON summary of loaded dropkit definitions.
                async execute() {
                  return JSON.stringify(runtime.summary(loaded), null, 2);
                },
              }),
            },
          }
        : {}),
    };
  };
}
