import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const FIXTURE = path.join(__dirname, "temp-bundled-output");
const APP_PORT = "4179";

const savedEnv = {
	DATABASE_URL: process.env.DATABASE_URL,
	NUXT_DATABASE_URL: process.env.NUXT_DATABASE_URL,
	NUXT_PUBLIC_PORT: process.env.NUXT_PUBLIC_PORT,
	NUXT_PUBLIC_LABEL: process.env.NUXT_PUBLIC_LABEL,
	SHARED_TOKEN: process.env.SHARED_TOKEN,
};

afterEach(() => {
	restoreEnv();
	fs.rmSync(FIXTURE, { recursive: true, force: true });
});

describe("Nitro output boots from the bundled schema", () => {
	it("starts a copied .output without the source schema, jiti, or import.meta.url", async () => {
		process.env.NUXT_DATABASE_URL = "postgres://build/db";
		process.env.DATABASE_URL = "from-process-env";
		process.env.NUXT_PUBLIC_PORT = "4000";
		process.env.NUXT_PUBLIC_LABEL = "build-label";
		process.env.SHARED_TOKEN = "shared-build";

		writeFixture();

		const { build, loadNuxt } = await import("nuxt");
		const nuxt = await loadNuxt({
			cwd: FIXTURE,
			dev: false,
			ready: true,
			overrides: {
				telemetry: false as never,
			},
		});

		try {
			await build(nuxt);
		} finally {
			await nuxt.close();
		}

		const outputDir = path.join(FIXTURE, ".output");
		const serverEntry = path.join(outputDir, "server", "index.mjs");
		expect(fs.existsSync(serverEntry)).toBe(true);

		const serverFiles = listServerJs(path.join(outputDir, "server"));
		const bundledSource = serverFiles
			.map((file) => fs.readFileSync(file, "utf8"))
			.join("\n");
		expect(bundledSource).not.toContain("createJiti");
		expect(bundledSource).not.toContain(path.join(FIXTURE, "env.ts"));
		expect(bundledSource).toContain("loadBundledSchema");
		expect(bundledSource).toContain("beginBundledCapture");
		expect(
			fs.existsSync(path.join(outputDir, "server", "node_modules", "jiti")),
		).toBe(false);

		fs.rmSync(path.join(FIXTURE, "env.ts"));
		fs.rmSync(path.join(FIXTURE, "shared.ts"));

		const copied = fs.mkdtempSync(path.join(os.tmpdir(), "arkenv-nuxt-out-"));
		try {
			fs.cpSync(outputDir, copied, { recursive: true });

			const invalid = await runServer(copied, {
				NUXT_DATABASE_URL: "postgres://live/db",
				DATABASE_URL: "from-process-env",
				NUXT_PUBLIC_PORT: "nope",
				NUXT_PUBLIC_LABEL: "",
				SHARED_TOKEN: "shared-live",
			});
			expect(invalid.code).not.toBe(0);
			expect(invalid.stderr).toMatch(/number|NUXT_PUBLIC_PORT|ArkEnv/i);

			const valid = await runServer(copied, {
				NUXT_DATABASE_URL: "",
				DATABASE_URL: "from-process-env",
				NUXT_PUBLIC_PORT: "4000",
				NUXT_PUBLIC_LABEL: "",
				SHARED_TOKEN: "shared-live",
			});
			expect(valid.code).toBe(0);
			expect(valid.body.port).toBe(4000);
			expect(valid.body.portType).toBe("number");
			expect(valid.body.label).toBe("");
			expect(valid.body.db).toBe("");
			expect(valid.body.envPort).toBe(4000);
			expect(valid.body.shared).toBe("shared-live");
		} finally {
			fs.rmSync(copied, { recursive: true, force: true });
		}
	}, 180_000);
});

/**
 * List emitted server JavaScript files, skipping traced `node_modules`.
 *
 * @param serverDir Nitro server output directory
 * @returns Absolute paths of server chunks
 */
function listServerJs(serverDir: string): string[] {
	const files: string[] = [];
	const visit = (dir: string) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name === "node_modules") continue;
				visit(full);
				continue;
			}
			if (entry.name.endsWith(".mjs") || entry.name.endsWith(".js")) {
				files.push(full);
			}
		}
	};
	visit(serverDir);
	return files;
}

/**
 * Write a minimal Nuxt app whose schema is only available at build time.
 */
function writeFixture(): void {
	fs.rmSync(FIXTURE, { recursive: true, force: true });
	fs.mkdirSync(path.join(FIXTURE, "server", "api"), { recursive: true });
	fs.mkdirSync(path.join(FIXTURE, "app"), { recursive: true });

	const moduleEntry = path.join(__dirname, "module.ts");
	const nuxtEntry = path.join(__dirname, "index.ts");

	fs.writeFileSync(
		path.join(FIXTURE, "package.json"),
		JSON.stringify({
			name: "arkenv-nuxt-fixture",
			private: true,
			type: "module",
		}),
	);
	fs.writeFileSync(
		path.join(FIXTURE, "nuxt.config.ts"),
		`
export default defineNuxtConfig({
  modules: [${JSON.stringify(moduleEntry)}],
  alias: { "@arkenv/nuxt": ${JSON.stringify(nuxtEntry)} },
  compatibilityDate: "2024-04-03",
  nitro: { minify: false, sourceMap: false },
  routeRules: { "/": { prerender: true } },
});
`,
	);
	fs.writeFileSync(
		path.join(FIXTURE, "shared.ts"),
		`
import arkenv from "@arkenv/nuxt";
export const shared = arkenv({ SHARED_TOKEN: "string" });
`,
	);
	fs.writeFileSync(
		path.join(FIXTURE, "env.ts"),
		`
import arkenv from "@arkenv/nuxt";
import { shared } from "./shared";
export const env = arkenv({
  DATABASE_URL: "string",
  NUXT_PUBLIC_PORT: "number",
  NUXT_PUBLIC_LABEL: "string",
}, { extends: [shared] });
`,
	);
	fs.writeFileSync(
		path.join(FIXTURE, "app", "app.vue"),
		"<template><div>ok</div></template>\n",
	);
	fs.writeFileSync(
		path.join(FIXTURE, "server", "api", "config.get.ts"),
		`
import { env } from "../../env";
import { defineEventHandler } from "h3";
import { useRuntimeConfig } from "nitropack/runtime";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  return {
    port: config.public.NUXT_PUBLIC_PORT,
    portType: typeof config.public.NUXT_PUBLIC_PORT,
    label: config.public.NUXT_PUBLIC_LABEL,
    db: config.DATABASE_URL,
    envPort: env.NUXT_PUBLIC_PORT,
    shared: env.SHARED_TOKEN,
  };
});
`,
	);
}

/**
 * Start the copied Nitro server and return the config route, or the failure.
 *
 * @param outputDir Copied `.output` directory
 * @param env Live environment variables for this boot
 * @returns Exit code, stderr, and parsed JSON when the server answered
 */
function runServer(
	outputDir: string,
	env: Record<string, string>,
): Promise<{
	code: number | null;
	stderr: string;
	body: Record<string, unknown>;
}> {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, ["server/index.mjs"], {
			cwd: outputDir,
			env: {
				...process.env,
				...env,
				PORT: APP_PORT,
				NITRO_PORT: APP_PORT,
				HOST: "127.0.0.1",
				NITRO_HOST: "127.0.0.1",
			},
			stdio: ["ignore", "pipe", "pipe"],
		});

		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk) => {
			stdout += String(chunk);
		});
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});

		const timer = setTimeout(() => {
			child.kill("SIGKILL");
			reject(new Error(`server timed out\n${stdout}\n${stderr}`));
		}, 20_000);

		const poll = setInterval(async () => {
			if (child.exitCode !== null) {
				clearInterval(poll);
				clearTimeout(timer);
				resolve({
					code: child.exitCode,
					stderr: `${stdout}\n${stderr}`,
					body: {},
				});
				return;
			}
			try {
				const response = await fetch(`http://127.0.0.1:${APP_PORT}/api/config`);
				if (!response.ok) return;
				const body = (await response.json()) as Record<string, unknown>;
				clearInterval(poll);
				clearTimeout(timer);
				child.kill("SIGTERM");
				child.on("exit", (code) => {
					resolve({ code: code ?? 0, stderr, body });
				});
			} catch {
				// Server is still booting.
			}
		}, 200);

		child.on("error", (error) => {
			clearInterval(poll);
			clearTimeout(timer);
			reject(error);
		});
	});
}

/**
 * Restore environment variables mutated by the output test.
 */
function restoreEnv(): void {
	for (const [key, value] of Object.entries(savedEnv)) {
		if (value === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = value;
		}
	}
}
