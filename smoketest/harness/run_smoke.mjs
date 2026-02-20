import { spawn } from "node:child_process";

const harnessDir = new URL("./", import.meta.url);
const smokeModel = process.env.SMOKETEST_MODEL || "openrouter/x-ai/grok-4.1-fast";

function runCapture(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...(options.env || {}),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

let exitCode = 0;
try {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("Missing OPENROUTER_API_KEY for smoketest");
  }

  const result = await runCapture(
    "opencode",
    ["run", "--model", smokeModel, "--command", "ping", "ci-arg", "--format", "json"],
    {
      cwd: harnessDir,
      env: {
        OPENCODE_CONFIG: new URL("opencode.json", harnessDir).pathname,
        OPENCODE_DISABLE_MODELS_FETCH: "true",
        OPENCODE_DISABLE_DEFAULT_PLUGINS: "true",
      },
    },
  );

  if (result.code !== 0) {
    throw new Error(`opencode run failed (exit=${result.code})`);
  }

  const combined = `${result.stdout}\n${result.stderr}`;
  if (!combined.includes("SMOKETEST_PLUGIN_COMMAND_MARKER::ci-arg")) {
    throw new Error("Missing command marker in opencode output");
  }

  console.log("Smoketest passed");
} catch (error) {
  exitCode = 1;
  console.error(error instanceof Error ? error.message : String(error));
}

process.exit(exitCode);
