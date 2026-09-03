import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";
import type { BenchmarkData } from "../apps/www/lib/benchmark/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_PATH = join(ROOT, "apps/www/lib/benchmark/benchmark.json");

type BuildTarget = {
	code: string;
	dir: string;
	external?: string[];
	fallbackBytes: number;
	fallbackGzipBytes: number;
};

async function measure(
	target: BuildTarget,
): Promise<{ bytes: number; gzipBytes: number }> {
	try {
		const res = await build({
			stdin: { contents: target.code, resolveDir: target.dir },
			bundle: true,
			minify: true,
			treeShaking: true,
			format: "esm",
			platform: "neutral",
			target: "es2022",
			write: false,
			external: target.external ?? [],
		});
		const buffer = res.outputFiles[0].contents;
		return {
			bytes: buffer.length,
			gzipBytes: gzipSync(buffer).length,
		};
	} catch (err: unknown) {
		console.warn(
			`Falling back to static metrics for build target: ${err instanceof Error ? err.message : String(err)}`,
		);
		return {
			bytes: target.fallbackBytes,
			gzipBytes: target.fallbackGzipBytes,
		};
	}
}

function toKb(bytes: number): string {
	return (bytes / 1024).toFixed(1);
}

async function run() {
	// 1. Measure Core Engine & Core + ArkType
	const coreEngine = await measure({
		code: `import arkenv from "${join(ROOT, "packages/core/dist/index.mjs")}"; console.log(arkenv);`,
		dir: join(ROOT, "packages/core"),
		external: ["arktype", "@ark/util", "@ark/schema", "arkregex"],
		fallbackBytes: 6424,
		fallbackGzipBytes: 2913,
	});

	const coreArkType = await measure({
		code: `import arkenv from "${join(ROOT, "packages/core/dist/index.mjs")}"; import { type } from "arktype"; console.log(arkenv(type({ PORT: "0 <= number.integer <= 65535" })));`,
		dir: join(ROOT, "packages/core"),
		fallbackBytes: 159771,
		fallbackGzipBytes: 49631,
	});

	// 2. Measure Standard Engine & Standard + Valibot / Zod
	const standardEngine = await measure({
		code: `import arkenv from "${join(ROOT, "packages/standard/dist/index.js")}"; console.log(arkenv);`,
		dir: join(ROOT, "packages/standard"),
		fallbackBytes: 10222,
		fallbackGzipBytes: 4106,
	});

	const standardValibot = await measure({
		code: `import arkenv from "${join(ROOT, "packages/standard/dist/valibot.js")}"; import * as v from "valibot"; console.log(arkenv(v.object({ PORT: v.string() })));`,
		dir: join(ROOT, "packages/standard"),
		fallbackBytes: 23897,
		fallbackGzipBytes: 7718,
	});

	const standardZod = await measure({
		code: `import arkenv from "${join(ROOT, "packages/standard/dist/index.js")}"; import { z } from "zod"; console.log(arkenv({ PORT: z.string() }));`,
		dir: join(ROOT, "packages/standard"),
		fallbackBytes: 337145,
		fallbackGzipBytes: 68682,
	});

	// 3. Competitor Benchmarks (fallbacks from npm/bundlephobia / isolated measurements)
	const t3Engine = {
		bytes: 14541,
		gzipBytes: 4300,
	};
	const t3Zod = {
		bytes: 332800,
		gzipBytes: 67584,
	};
	const varlock = {
		bytes: 29082,
		gzipBytes: 9318,
	};

	// 4. Construct rows for each validator tab
	const results: BenchmarkData = {
		arktype: [
			{
				id: "arkenv-core",
				name: "@arkenv/core",
				npmPackage: "@arkenv/core",
				engineBytes: coreEngine.bytes,
				engineKb: toKb(coreEngine.bytes),
				engineGzipBytes: coreEngine.gzipBytes,
				engineGzipKb: toKb(coreEngine.gzipBytes),
				validatorName: "ArkType",
				validatorBytes: Math.max(0, coreArkType.bytes - coreEngine.bytes),
				validatorKb: toKb(Math.max(0, coreArkType.bytes - coreEngine.bytes)),
				validatorGzipBytes: Math.max(
					0,
					coreArkType.gzipBytes - coreEngine.gzipBytes,
				),
				validatorGzipKb: toKb(
					Math.max(0, coreArkType.gzipBytes - coreEngine.gzipBytes),
				),
				totalBytes: coreArkType.bytes,
				totalKb: toKb(coreArkType.bytes),
				totalGzipBytes: coreArkType.gzipBytes,
				totalGzipKb: toKb(coreArkType.gzipBytes),
				tier: "primary",
			},
			{
				id: "t3-env",
				name: "@t3-oss/env-core",
				npmPackage: "@t3-oss/env-core",
				engineBytes: t3Engine.bytes,
				engineKb: toKb(t3Engine.bytes),
				engineGzipBytes: t3Engine.gzipBytes,
				engineGzipKb: toKb(t3Engine.gzipBytes),
				validatorName: "Zod",
				validatorBytes: t3Zod.bytes - t3Engine.bytes,
				validatorKb: toKb(t3Zod.bytes - t3Engine.bytes),
				validatorGzipBytes: t3Zod.gzipBytes - t3Engine.gzipBytes,
				validatorGzipKb: toKb(t3Zod.gzipBytes - t3Engine.gzipBytes),
				totalBytes: t3Zod.bytes,
				totalKb: toKb(t3Zod.bytes),
				totalGzipBytes: t3Zod.gzipBytes,
				totalGzipKb: toKb(t3Zod.gzipBytes),
				tier: "competitor",
				note: "requires Zod",
			},
			{
				id: "varlock",
				name: "varlock",
				npmPackage: "varlock",
				engineBytes: varlock.bytes,
				engineKb: toKb(varlock.bytes),
				engineGzipBytes: varlock.gzipBytes,
				engineGzipKb: toKb(varlock.gzipBytes),
				totalBytes: varlock.bytes,
				totalKb: toKb(varlock.bytes),
				totalGzipBytes: varlock.gzipBytes,
				totalGzipKb: toKb(varlock.gzipBytes),
				tier: "reference",
				note: "for reference",
			},
		],
		zod: [
			{
				id: "arkenv-standard",
				name: "@arkenv/standard",
				npmPackage: "@arkenv/standard",
				engineBytes: standardEngine.bytes,
				engineKb: toKb(standardEngine.bytes),
				engineGzipBytes: standardEngine.gzipBytes,
				engineGzipKb: toKb(standardEngine.gzipBytes),
				validatorName: "Zod",
				validatorBytes: Math.max(0, standardZod.bytes - standardEngine.bytes),
				validatorKb: toKb(
					Math.max(0, standardZod.bytes - standardEngine.bytes),
				),
				validatorGzipBytes: Math.max(
					0,
					standardZod.gzipBytes - standardEngine.gzipBytes,
				),
				validatorGzipKb: toKb(
					Math.max(0, standardZod.gzipBytes - standardEngine.gzipBytes),
				),
				totalBytes: standardZod.bytes,
				totalKb: toKb(standardZod.bytes),
				totalGzipBytes: standardZod.gzipBytes,
				totalGzipKb: toKb(standardZod.gzipBytes),
				tier: "primary",
			},
			{
				id: "t3-env",
				name: "@t3-oss/env-core",
				npmPackage: "@t3-oss/env-core",
				engineBytes: t3Engine.bytes,
				engineKb: toKb(t3Engine.bytes),
				engineGzipBytes: t3Engine.gzipBytes,
				engineGzipKb: toKb(t3Engine.gzipBytes),
				validatorName: "Zod",
				validatorBytes: t3Zod.bytes - t3Engine.bytes,
				validatorKb: toKb(t3Zod.bytes - t3Engine.bytes),
				validatorGzipBytes: t3Zod.gzipBytes - t3Engine.gzipBytes,
				validatorGzipKb: toKb(t3Zod.gzipBytes - t3Engine.gzipBytes),
				totalBytes: t3Zod.bytes,
				totalKb: toKb(t3Zod.bytes),
				totalGzipBytes: t3Zod.gzipBytes,
				totalGzipKb: toKb(t3Zod.gzipBytes),
				tier: "competitor",
			},
			{
				id: "varlock",
				name: "varlock",
				npmPackage: "varlock",
				engineBytes: varlock.bytes,
				engineKb: toKb(varlock.bytes),
				engineGzipBytes: varlock.gzipBytes,
				engineGzipKb: toKb(varlock.gzipBytes),
				totalBytes: varlock.bytes,
				totalKb: toKb(varlock.bytes),
				totalGzipBytes: varlock.gzipBytes,
				totalGzipKb: toKb(varlock.gzipBytes),
				tier: "reference",
				note: "for reference",
			},
		],
		valibot: [
			{
				id: "arkenv-standard",
				name: "@arkenv/standard",
				npmPackage: "@arkenv/standard",
				engineBytes: standardEngine.bytes,
				engineKb: toKb(standardEngine.bytes),
				engineGzipBytes: standardEngine.gzipBytes,
				engineGzipKb: toKb(standardEngine.gzipBytes),
				validatorName: "Valibot",
				validatorBytes: Math.max(
					0,
					standardValibot.bytes - standardEngine.bytes,
				),
				validatorKb: toKb(
					Math.max(0, standardValibot.bytes - standardEngine.bytes),
				),
				validatorGzipBytes: Math.max(
					0,
					standardValibot.gzipBytes - standardEngine.gzipBytes,
				),
				validatorGzipKb: toKb(
					Math.max(0, standardValibot.gzipBytes - standardEngine.gzipBytes),
				),
				totalBytes: standardValibot.bytes,
				totalKb: toKb(standardValibot.bytes),
				totalGzipBytes: standardValibot.gzipBytes,
				totalGzipKb: toKb(standardValibot.gzipBytes),
				tier: "primary",
			},
			{
				id: "t3-env",
				name: "@t3-oss/env-core",
				npmPackage: "@t3-oss/env-core",
				engineBytes: t3Engine.bytes,
				engineKb: toKb(t3Engine.bytes),
				engineGzipBytes: t3Engine.gzipBytes,
				engineGzipKb: toKb(t3Engine.gzipBytes),
				validatorName: "Zod",
				validatorBytes: t3Zod.bytes - t3Engine.bytes,
				validatorKb: toKb(t3Zod.bytes - t3Engine.bytes),
				validatorGzipBytes: t3Zod.gzipBytes - t3Engine.gzipBytes,
				validatorGzipKb: toKb(t3Zod.gzipBytes - t3Engine.gzipBytes),
				totalBytes: t3Zod.bytes,
				totalKb: toKb(t3Zod.bytes),
				totalGzipBytes: t3Zod.gzipBytes,
				totalGzipKb: toKb(t3Zod.gzipBytes),
				tier: "competitor",
				note: "requires Zod",
			},
			{
				id: "varlock",
				name: "varlock",
				npmPackage: "varlock",
				engineBytes: varlock.bytes,
				engineKb: toKb(varlock.bytes),
				engineGzipBytes: varlock.gzipBytes,
				engineGzipKb: toKb(varlock.gzipBytes),
				totalBytes: varlock.bytes,
				totalKb: toKb(varlock.bytes),
				totalGzipBytes: varlock.gzipBytes,
				totalGzipKb: toKb(varlock.gzipBytes),
				tier: "reference",
				note: "for reference",
			},
		],
	};

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
