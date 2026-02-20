import { ContentParser } from "./content_parser.ts";
import { DefinitionRegistry } from "./definition_registry.ts";
import { FileScanner } from "./file_scanner.ts";
import type { ContentKind, LoadPluginizedContentOptions, LoadedPluginizedContent, SourceDirectory } from "./types.ts";

export class PluginizedContentLoader {
  parser = new ContentParser();
  scanner = new FileScanner();

  /// Load and merge pluginized content from configured directories.
  load(options: LoadPluginizedContentOptions): LoadedPluginizedContent {
    const registry = new DefinitionRegistry();

    // Deterministic flow: plugin defaults -> global -> project.
    for (const directory of options.directories) {
      this.loadAgentsFromDirectory(directory, registry);
      this.loadCommandsFromDirectory(directory, registry);
      this.loadSkillsFromDirectory(directory, registry);
    }

    return registry.snapshot();
  }

  loadAgentsFromDirectory(directory: SourceDirectory, registry: DefinitionRegistry): void {
    this.loadKindFromDirectory("agent", directory, registry);
  }

  loadCommandsFromDirectory(directory: SourceDirectory, registry: DefinitionRegistry): void {
    this.loadKindFromDirectory("command", directory, registry);
  }

  loadSkillsFromDirectory(directory: SourceDirectory, registry: DefinitionRegistry): void {
    this.loadKindFromDirectory("skill", directory, registry);
  }

  /// Parse all files for one kind in one source directory.
  loadKindFromDirectory(kind: ContentKind, directory: SourceDirectory, registry: DefinitionRegistry): void {
    const files = this.scanner.listByKind(directory.rootDir, kind);

    for (const filePath of files) {
      const parsed = this.parser.parseFile(kind, filePath, directory.source);
      registry.diagnostics.push(...parsed.diagnostics);
      if (!parsed.definition) continue;
      registry.add(kind, parsed.definition, filePath);
    }
  }
}
