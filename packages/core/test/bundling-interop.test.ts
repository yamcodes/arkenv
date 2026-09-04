import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("arkenv bundling interop", () => {
	const projectRoot = join(__dirname, "..");
	const esbuildPath = join(projectRoot, "../../node_modules/.bin/esbuild");

	it("should work when @arkenv/core is inlined into a CJS bundle", () => {
		const tempDir = mkdtempSync(
			join(projectRoot, `test/temp-interop-${randomUUID()}`),
		);

		try {
			const testFile = join(tempDir, "test.ts");
			const outFile = join(tempDir, "test.cjs");

			// Create a test script
			writeFileSync(
				testFile,
				`import arkenv from "@arkenv/core";
const env = arkenv({});
console.log('SUCCESS');
`,
			);

			// Bundle it with esbuild as CJS, inlining the ESM-only @arkenv/core
			execSync(
				`${esbuildPath} ${testFile} --bundle --format=cjs --platform=node --outfile=${outFile}`,
				{ cwd: tempDir, stdio: "ignore" },
			);

			// Run the bundled output
			const output = execSync(`node ${outFile}`, {
				encoding: "utf8",
				cwd: tempDir,
			});
			expect(output.trim()).toBe("SUCCESS");
		} finally {
			if (existsSync(tempDir)) {
				rmSync(tempDir, { recursive: true, force: true });
			}
		}
	});

	it("should work when @arkenv/standard is external in an ESM bundle (no ArkType needed)", () => {
		const tempDir = mkdtempSync(
			join(projectRoot, `test/temp-interop-${randomUUID()}`),
		);

		try {
			const testFile = join(tempDir, "test.ts");
			const outFile = join(tempDir, "test.mjs");

			// Create a test script using the standard entry (ArkType-free)
			writeFileSync(
				testFile,
				`import arkenv from "@arkenv/standard";
const schema = { PORT: { "~standard": { version: 1, validate: (v) => ({ value: v }) } } };
const env = arkenv(schema, { env: { PORT: "3000" } });
console.log('SUCCESS');
`,
			);

			// Bundle it with esbuild as ESM, marking @arkenv/standard as external
			execSync(
				`${esbuildPath} ${testFile} --bundle --format=esm --platform=node --external:@arkenv/standard --outfile=${outFile}`,
				{ cwd: tempDir, stdio: "ignore" },
			);

			// Assert the actual standard dist artifact contains no arktype references (isolation invariant)
			const distPath = join(projectRoot, "../standard/dist/index.js");
			const distContents = readFileSync(distPath, "utf8");
			expect(distContents).not.toContain("arktype");

			const output = execSync(`node ${outFile}`, {
				encoding: "utf8",
				cwd: tempDir,
			});
			expect(output.trim()).toBe("SUCCESS");
		} finally {
			if (existsSync(tempDir)) {
				rmSync(tempDir, { recursive: true, force: true });
			}
		}
	});

	it("should inline @arkenv/core into an ESM bundle with no CJS dependencies", () => {
		const tempDir = mkdtempSync(
			join(projectRoot, `test/temp-interop-${randomUUID()}`),
		);

		try {
			const testFile = join(tempDir, "test.ts");
			const outFile = join(tempDir, "test.mjs");

			// Create a test script that esbuild inlines fully (no externals)
			writeFileSync(
				testFile,
				`import arkenv from "@arkenv/core";
const env = arkenv({ PORT: 'number.port' }, { env: { PORT: '3000' } });
console.log('SUCCESS');
`,
			);

			// Bundle it with esbuild as ESM, inlining @arkenv/core
			execSync(
				`${esbuildPath} ${testFile} --bundle --format=esm --platform=node --outfile=${outFile}`,
				{ cwd: tempDir, stdio: "ignore" },
			);

			// The inlined bundle must not pull in any CommonJS interop artifacts
			const bundle = readFileSync(outFile, "utf8");
			expect(bundle).not.toMatch(/require\(\s*["']/);
			expect(bundle).not.toContain("module.exports");
			expect(bundle).not.toContain("__toCommonJS");

			const output = execSync(`node ${outFile}`, {
				encoding: "utf8",
				cwd: tempDir,
			});
			expect(output.trim()).toBe("SUCCESS");
		} finally {
			if (existsSync(tempDir)) {
				rmSync(tempDir, { recursive: true, force: true });
			}
		}
	});

	it("should load @arkenv/core via native require(esm)", () => {
		const require = createRequire(import.meta.url);
		const mod = require("@arkenv/core");
		const arkenv = mod.default ?? mod.arkenv;
		expect(typeof arkenv).toBe("function");
	});
});
