#!/usr/bin/env bun

type RunCommandOptions = {
  cwd?: string;
  env?: Record<string, string>;
  allowFailure?: boolean;
};

type RunCaptureOptions = {
  cwd?: string;
  env?: Record<string, string>;
};

export type CommandCaptureResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export async function runCommand(command: string[], options: RunCommandOptions = {}): Promise<number> {
  console.log(`$ ${command.join(" ")}`);

  const child = Bun.spawn(command, {
    cwd: options.cwd,
    env: {
      ...globalThis.process.env,
      ...(options.env ?? {}),
    },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await child.exited;
  if (exitCode !== 0 && !options.allowFailure) {
    throw new Error(`Command failed (exit=${exitCode}): ${command.join(" ")}`);
  }

  return exitCode;
}

export async function runCommandCapture(command: string[], options: RunCaptureOptions = {}): Promise<CommandCaptureResult> {
  console.log(`$ ${command.join(" ")}`);

  const child = Bun.spawn(command, {
    cwd: options.cwd,
    env: {
      ...globalThis.process.env,
      ...(options.env ?? {}),
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  const [exitCode, stdout, stderr] = await Promise.all([child.exited, child.stdout.text(), child.stderr.text()]);

  return {
    exitCode,
    stdout,
    stderr,
  };
}
