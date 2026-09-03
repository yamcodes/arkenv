import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_PATH = join(ROOT, "apps/www/lib/benchmark/benchmark.json");

type TestCase = {
	id: string;
	name: string;
	code: string;
	dir: string;
	tier: "primary" | "secondary" | "competitor";
	fallbackBytes?: number;
	/** Packages esbuild should treat as external (not bundled). */
	external?: string[];
};

type BenchmarkResult = {
	id: string;
	name: string;
	bytes: number;
	kb: string;
	tier: "primary" | "secondary" | "competitor";
	source: "esbuild" | "bundlephobia";
};

const cases: Record<"full" | "adapter", TestCase[]> = {
	full: [
		{
			id: "standard-valibot",
			name: "@arkenv/standard + Valibot",
			// Full payload: adapter + valibot bundled together (no externals)
			code: `import arkenv from "${join(ROOT, "packages/standard/dist/valibot.js")}"; import * as v from "valibot"; console.log(arkenv(v.object({ PORT: v.string() })));`,
			dir: join(ROOT, "packages/standard"),
			tier: "primary",
			fallbackBytes: 23897, // 23.3 kB
		},
		{
			id: "core-arktype",
			name: "@arkenv/core + ArkType",
			// Full payload: adapter + arktype bundled together (no externals)
			code: `import arkenv from "${join(ROOT, "packages/core/dist/index.mjs")}"; import { type } from "arktype"; console.log(arkenv(type({ PORT: "0 <= number.integer <= 65535" })));`,
			dir: join(ROOT, "packages/core"),
			tier: "secondary",
			fallbackBytes: 159771, // 156.0 kB
		},
		{
			id: "varlock",
			name: "varlock",
			code: `import { env } from "varlock"; console.log(env);`,
			dir: ROOT,
			tier: "competitor",
			fallbackBytes: 29082, // 28.4 kB — measured via bundlephobia; not in workspace
		},
		{
			id: "t3-zod",
			name: "@t3-oss/env-core + Zod",
			code: `import { createEnv } from "@t3-oss/env-core"; import { z } from "zod"; console.log(createEnv({ server: { PORT: z.string() }, runtimeEnv: {} }));`,
			dir: join(ROOT, "packages/core"),
			tier: "competitor",
			fallbackBytes: 332800, // ~325.0 kB (Zod 319 kB + t3-env); not in workspace
		},
	],
	adapter: [
		{
			id: "standard-only",
			name: "@arkenv/standard",
			// Adapter-only: no required runtime peers — measures pure Standard Schema wrapper
			code: `import arkenv from "${join(ROOT, "packages/standard/dist/index.js")}"; console.log(arkenv);`,
			dir: join(ROOT, "packages/standard"),
			tier: "primary",
			fallbackBytes: 10222, // 10.0 kB
		},
		{
			id: "core-only",
			name: "@arkenv/core",
			// Adapter-only: externalize arktype peer to isolate the wrapper footprint
			code: `import arkenv from "${join(ROOT, "packages/core/dist/index.mjs")}"; console.log(arkenv);`,
			dir: join(ROOT, "packages/core"),
			tier: "secondary",
			external: ["arktype", "@ark/util", "@ark/schema", "arkregex"],
			fallbackBytes: 6424, // 6.3 kB
		},
		{
			id: "t3-only",
			name: "@t3-oss/env-core",
			// Adapter-only: externalize zod peer for apples-to-apples adapter comparison
			code: `import { createEnv } from "@t3-oss/env-core"; console.log(createEnv);`,
			dir: join(ROOT, "packages/core"),
			tier: "competitor",
			fallbackBytes: 14541, // 14.2 kB; not in workspace
			external: ["zod"],
		},
	],
};

async function run() {
	const results: Record<"full" | "adapter", BenchmarkResult[]> = {
		full: [],
		adapter: [],
	};

	for (const [mode, tests] of Object.entries(cases) as [
		"full" | "adapter",
		TestCase[],
	][]) {
		for (const t of tests) {
			let bytes: number | undefined;
			let source: "esbuild" | "bundlephobia" = "esbuild";
			try {
				const res = await build({
					stdin: { contents: t.code, resolveDir: t.dir },
					bundle: true,
					minify: true,
					treeShaking: true,
					format: "esm",
					platform: "neutral",
					target: "es2022",
					write: false,
					external: t.external ?? [],
				});
				bytes = res.outputFiles[0].contents.length;
			} catch (e: unknown) {
				if (t.fallbackBytes) {
					bytes = t.fallbackBytes;
					source = "bundlephobia";
					console.warn(
						`Using fallback for ${t.name}: ${e instanceof Error ? e.message : String(e)}`,
					);
				} else {
					throw new Error(
						`Benchmark case ${t.name} failed (no fallback available): ${
							e instanceof Error ? e.message : String(e)
						}`,
					);
				}
			}

			if (bytes !== undefined) {
				results[mode].push({
					id: t.id,
					name: t.name,
					bytes,
					kb: (bytes / 1024).toFixed(1),
					tier: t.tier,
					source,
				});
			}
		}
	}

	if (!existsSync(dirname(OUT_PATH))) {
		mkdirSync(dirname(OUT_PATH), { recursive: true });
	}
	writeFileSync(OUT_PATH, `${JSON.stringify(results, null, "\t")}\n`);
	console.log("Benchmark artifact successfully generated at:", OUT_PATH);
}

run().catch((err) => {
	console.error("Benchmark generation error:", err);
	process.exit(1);
});
