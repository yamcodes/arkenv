import { spawn as nodeSpawn } from "node:child_process";

type Stdio = "pipe" | "inherit" | "ignore";

export type SpawnOptions = {
	cwd?: string;
	env?: NodeJS.ProcessEnv;
	stdout?: Stdio;
	stderr?: Stdio;
};

export type Spawned = {
	stdout: ReadableStream<Uint8Array>;
	stderr: ReadableStream<Uint8Array>;
	exited: Promise<number>;
};

const closedStream = (): ReadableStream<Uint8Array> =>
	new ReadableStream({
		start(controller) {
			controller.close();
		},
	});

/**
 * Buffer a Node stream so callers can read it before or after `exited`.
 * Listeners attach synchronously so output is not lost between spawn and read.
 */
const capture = (
	stream: NodeJS.ReadableStream | null,
): ReadableStream<Uint8Array> => {
	if (!stream) return closedStream();

	const chunks: Uint8Array[] = [];
	let ended = false;
	let failure: Error | undefined;
	const waiters: Array<() => void> = [];

	const wake = () => {
		const pending = waiters.splice(0);
		for (const resolve of pending) resolve();
	};

	stream.on("data", (chunk: Buffer | string) => {
		const bytes = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
		chunks.push(new Uint8Array(bytes));
		wake();
	});
	stream.on("end", () => {
		ended = true;
		wake();
	});
	stream.on("error", (error: Error) => {
		failure = error;
		ended = true;
		wake();
	});

	return new ReadableStream({
		async pull(controller) {
			while (chunks.length === 0 && !ended) {
				await new Promise<void>((resolve) => {
					waiters.push(resolve);
				});
			}
			const next = chunks.shift();
			if (next) {
				controller.enqueue(next);
				return;
			}
			if (failure) {
				controller.error(failure);
				return;
			}
			controller.close();
		},
	});
};

export const spawn = (
	command: readonly string[],
	options: SpawnOptions = {},
): Spawned => {
	const [file, ...args] = command;
	if (!file) {
		throw new Error("spawn requires a command");
	}

	const stdoutMode = options.stdout ?? "pipe";
	const stderrMode = options.stderr ?? "pipe";

	const child = nodeSpawn(file, args, {
		cwd: options.cwd,
		env: options.env,
		stdio: ["ignore", stdoutMode, stderrMode],
	});

	const exited = new Promise<number>((resolve, reject) => {
		child.once("error", reject);
		child.once("close", (code) => {
			resolve(code ?? 1);
		});
	});

	return {
		stdout: stdoutMode === "pipe" ? capture(child.stdout) : closedStream(),
		stderr: stderrMode === "pipe" ? capture(child.stderr) : closedStream(),
		exited,
	};
};
