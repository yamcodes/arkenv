import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";

export type InitResult = {
	status: "success" | "error";
	exitCode: number;
	stdout: string;
	stderr: string;
	command: string;
	args: string[];
};

export type SpawnFn = (
	command: string,
	args: string[],
	options: { cwd: string },
) => Promise<{ stdout: string; stderr: string; exitCode: number }>;

/**
 * Scaffold ArkEnv in `cwd` by delegating to `arkenv init --agent`.
 *
 * @param cwd Project directory
 * @param extraArgs Extra CLI flags (for example `["--force"]` after a refusal)
 * @param spawnFn Optional spawn implementation (tests)
 * @returns Captured CLI stdout/stderr and exit status
 */
export async function initProject(
	cwd: string,
	extraArgs: string[] = [],
	spawnFn: SpawnFn = spawnProcess,
): Promise<InitResult> {
	const { command, prefixArgs } = await resolveArkEnvCommand(cwd);
	const args = [...prefixArgs, "init", "--agent", ...extraArgs];
	const result = await spawnFn(command, args, { cwd });
	return {
		status: result.exitCode === 0 ? "success" : "error",
		exitCode: result.exitCode,
		stdout: result.stdout,
		stderr: result.stderr,
		command,
		args,
	};
}

/**
 * Resolve the local `arkenv` binary or fall back to `npx arkenv@latest`.
 *
 * @param cwd Project directory
 * @returns Command plus args that precede `init`
 */
export async function resolveArkEnvCommand(
	cwd: string,
): Promise<{ command: string; prefixArgs: string[] }> {
	const fromEnv = process.env.ARKENV_BIN;
	if (fromEnv) {
		return { command: fromEnv, prefixArgs: [] };
	}
	const localBin = path.join(cwd, "node_modules", ".bin", "arkenv");
	try {
		await access(localBin);
		return { command: localBin, prefixArgs: [] };
	} catch {
		return { command: "npx", prefixArgs: ["--yes", "arkenv@latest"] };
	}
}

function spawnProcess(
	command: string,
	args: string[],
	options: { cwd: string },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: options.cwd,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk: Buffer | string) => {
			stdout += String(chunk);
		});
		child.stderr.on("data", (chunk: Buffer | string) => {
			stderr += String(chunk);
		});
		child.on("error", reject);
		child.on("close", (code) => {
			resolve({ stdout, stderr, exitCode: code ?? 1 });
		});
	});
}
