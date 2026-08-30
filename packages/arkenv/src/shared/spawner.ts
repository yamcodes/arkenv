import { spawn } from "node:child_process";

export type SpawnLatestOptions = {
	packageName: string;
	args: string[];
	tag?: string | undefined;
	userAgent?: string | undefined;
	spawnFn?: typeof spawn | undefined;
};

export type SpawnerPort = {
	spawnLatest(options: SpawnLatestOptions): Promise<number>;
};

/**
 * Resolves the runner command and arguments based on the package manager user agent.
 *
 * @param packageName Target package name (e.g. "arkenv").
 * @param args Initial CLI arguments to forward.
 * @param userAgent The `npm_config_user_agent` string.
 * @param tag The dist-tag or version to spawn (defaults to "latest").
 * @returns The executable command and its arguments.
 */
export function resolveDlxCommand(
	packageName: string,
	args: string[],
	userAgent = process.env.npm_config_user_agent || "",
	tag = "latest",
): { command: string; dlxArgs: string[] } {
	const target = `${packageName}@${tag}`;

	if (userAgent.includes("pnpm")) {
		return {
			command: "pnpm",
			dlxArgs: ["dlx", target, ...args],
		};
	}

	if (userAgent.includes("bun")) {
		return {
			command: "bunx",
			dlxArgs: [target, ...args],
		};
	}

	if (userAgent.includes("yarn")) {
		return {
			command: "yarn",
			dlxArgs: ["dlx", target, ...args],
		};
	}

	// Fallback to npx
	return {
		command: "npx",
		dlxArgs: [target, ...args],
	};
}

/**
 * Spawns the latest version of the CLI using the active package manager's DLX tool,
 * inheriting stdio and forwarding termination signals.
 *
 * @param options Spawn options containing package name, args, optional tag, optional user agent, and optional spawnFn.
 * @returns A promise resolving to the exit code of the spawned child process.
 */
export async function spawnLatest(
	options: SpawnLatestOptions,
): Promise<number> {
	const { command, dlxArgs } = resolveDlxCommand(
		options.packageName,
		options.args,
		options.userAgent,
		options.tag,
	);
	const spawnFn = options.spawnFn ?? spawn;

	return new Promise<number>((resolve, reject) => {
		const child = spawnFn(command, dlxArgs, {
			stdio: "inherit",
			shell: process.platform === "win32",
		});

		const onSigint = () => {
			child.kill("SIGINT");
		};
		const onSigterm = () => {
			child.kill("SIGTERM");
		};

		process.on("SIGINT", onSigint);
		process.on("SIGTERM", onSigterm);

		const cleanup = () => {
			process.off("SIGINT", onSigint);
			process.off("SIGTERM", onSigterm);
		};

		child.on("error", (err) => {
			cleanup();
			reject(err);
		});

		child.on("close", (code, signal) => {
			cleanup();
			if (signal === "SIGINT") {
				resolve(code ?? 130);
				return;
			}
			if (signal === "SIGTERM") {
				resolve(code ?? 143);
				return;
			}
			if (signal) {
				resolve(code ?? 1);
				return;
			}
			resolve(code ?? 0);
		});
	});
}
