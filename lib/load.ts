import { PluginizedContentLoader } from "./pluginized_content_loader.ts";
import type { LoadPluginizedContentOptions, LoadedPluginizedContent } from "./types.ts";

/// Public loader entrypoint used by plugin runtime.
export function loadPluginizedContent(options: LoadPluginizedContentOptions): LoadedPluginizedContent {
  const loader = new PluginizedContentLoader();
  return loader.load(options);
}
