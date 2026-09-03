import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";
import type {
	BenchmarkData,
	BenchmarkRow,
} from "../apps/www/lib/benchmark/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_PATH = join(ROOT, "apps/www/lib/benchmark/benchmark.json");

type BuildTarget = {
	name: string;
	code: string;
	dir: string;
	external?: string[];
	fallbackBytes?: number;
	fallbackGzipBytes?: number;
};

async function measure(target: BuildTarget): Promise<{
	bytes: number;
	gzipBytes: number;
	source: "esbuild" | "bundlephobia";
}> {
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
			source: "esbuild",
		};
	} catch (err: unknown) {
		if (
			target.fallbackBytes !== undefined &&
			target.fallbackGzipBytes !== undefined
		) {
			console.warn(
				`Using fallback for ${target.name}: ${err instanceof Error ? err.message : String(err)}`,
			);
			return {
				bytes: target.fallbackBytes,
				gzipBytes: target.fallbackGzipBytes,
				source: "bundlephobia",
			};
		}
		throw new Error(
			`Benchmark measurement for ${target.name} failed (no fallback allowed): ${
				err instanceof Error ? err.message : String(err)
			}`,
		);
	}
}

function toKb(bytes: number): string {
	return (bytes / 1024).toFixed(1);
}

async function run() {
	// 1. Measure Core Engine & Core + ArkType (must build fresh, no fallbacks allowed)
	const coreEngine = await measure({
		name: "@arkenv/core (engine)",
		code: `import arkenv from "${join(ROOT, "packages/core/dist/index.mjs")}"; console.log(arkenv);`,
		dir: join(ROOT, "packages/core"),
		external: ["arktype", "@ark/util", "@ark/schema", "arkregex"],
	});

	const coreArkType = await measure({
		name: "@arkenv/core + ArkType",
		code: `import arkenv from "${join(ROOT, "packages/core/dist/index.mjs")}"; import { type } from "arktype"; console.log(arkenv(type({ PORT: "0 <= number.integer <= 65535" })));`,
		dir: join(ROOT, "packages/core"),
	});

	// 2. Measure Standard Engine & Standard + Valibot / Zod / Zod Mini (must build fresh, no fallbacks allowed)
	const standardEngine = await measure({
		name: "@arkenv/standard (engine)",
		code: `import arkenv from "${join(ROOT, "packages/standard/dist/index.js")}"; console.log(arkenv);`,
		dir: join(ROOT, "packages/standard"),
	});

	const standardValibot = await measure({
		name: "@arkenv/standard/valibot + Valibot",
		code: `import arkenv from "${join(ROOT, "packages/standard/dist/valibot.js")}"; import * as v from "valibot"; console.log(arkenv(v.object({ PORT: v.string() })));`,
		dir: join(ROOT, "packages/standard"),
	});

	const standardZod = await measure({
		name: "@arkenv/standard + Zod",
		code: `import arkenv from "${join(ROOT, "packages/standard/dist/index.js")}"; import { z } from "zod"; console.log(arkenv({ PORT: z.string() }));`,
		dir: join(ROOT, "packages/standard"),
	});

	const standardZodMini = await measure({
		name: "@arkenv/standard/zod-mini + Zod Mini",
		code: `import arkenv from "${join(ROOT, "packages/standard/dist/zod-mini.js")}"; import * as z from "zod/mini"; console.log(arkenv(z.object({ PORT: z.string() })));`,
		dir: join(ROOT, "packages/standard"),
	});

	// 3. Competitor Benchmarks (fallbacks from npm/bundlephobia / isolated measurements)
	const t3Engine = {
		bytes: 14541,
		gzipBytes: 4300,
	};
	// In practice, developers using @t3-oss/env-core are locked into the monolithic Zod ecosystem (325.0 kB).
	// While theoretical Standard Schema adapters could exist:
	//   - Shelved theoretical ArkType + T3: 164.0 kB (14.2 kB engine + 149.8 kB ArkType)
	//   - Shelved theoretical Valibot + T3: 27.6 kB (14.2 kB engine + 13.4 kB Valibot)
	// We shelve those theoretical combinations: real-world T3 Env installations pay the full Zod tax.
	const t3Zod = {
		bytes: 332800,
		gzipBytes: 67584,
	};
	const varlock = {
		bytes: 29082,
		gzipBytes: 9318,
	};

	// 4. Construct sorted leaderboard of real-world edge stacks
	const leaderboard: BenchmarkRow[] = (
		[
			{
				id: "arkenv-valibot",
				name: "ArkEnv",
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
				source: standardValibot.source,
			},
			{
				id: "varlock",
				name: "Varlock",
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
				source: "bundlephobia",
			},
			{
				id: "arkenv-arktype",
				name: "ArkEnv",
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
				source: coreArkType.source,
			},
			{
				id: "t3-env-zod",
				name: "T3 Env",
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
				source: "bundlephobia",
			},
		] satisfies BenchmarkRow[]
	).sort((a, b) => a.totalBytes - b.totalBytes);

	const results: BenchmarkData = {
		leaderboard,
		matrix: {
			valibot: {
				engine: "@arkenv/standard/valibot",
				subpath: "@arkenv/standard/valibot",
				totalBytes: standardValibot.bytes,
				totalKb: toKb(standardValibot.bytes),
				gzipBytes: standardValibot.gzipBytes,
				gzipKb: toKb(standardValibot.gzipBytes),
				source: standardValibot.source,
				description: "Smallest edge footprint; modular functional tree-shaking",
			},
			zodMini: {
				engine: "@arkenv/standard/zod-mini",
				subpath: "@arkenv/standard/zod-mini",
				totalBytes: standardZodMini.bytes,
				totalKb: toKb(standardZodMini.bytes),
				gzipBytes: standardZodMini.gzipBytes,
				gzipKb: toKb(standardZodMini.gzipBytes),
				source: standardZodMini.source,
				description: "~90% smaller than classic Zod; familiar syntax",
			},
			arktype: {
				engine: "@arkenv/core",
				subpath: "@arkenv/core",
				totalBytes: coreArkType.bytes,
				totalKb: toKb(coreArkType.bytes),
				gzipBytes: coreArkType.gzipBytes,
				gzipKb: toKb(coreArkType.gzipBytes),
				source: coreArkType.source,
				description:
					"TypeScript-native DSL strings; built-in keywords; zero dependencies",
			},
			classicZod: {
				engine: "@arkenv/standard",
				subpath: "@arkenv/standard",
				totalBytes: standardZod.bytes,
				totalKb: toKb(standardZod.bytes),
				gzipBytes: standardZod.gzipBytes,
				gzipKb: toKb(standardZod.gzipBytes),
				source: standardZod.source,
				description: "Drop-in compatibility for existing Zod schemas (Zod 4)",
			},
		},
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
