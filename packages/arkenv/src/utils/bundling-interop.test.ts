import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("arkenv bundling interop", () => {
	// Find the package root (arkenv/packages/arkenv)
	const projectRoot = process.cwd().includes("packages/arkenv")
		? process.cwd()
		: join(process.cwd(), "packages/arkenv");

	const esbuildPath = join(projectRoot, "../../node_modules/.bin/esbuild");

	it("should work when arkenv is external in a CJS bundle", () => {
		const tempDir = mkdtempSync(
			join(tmpdir(), `arkenv-interop-test-${randomUUID()}`),
		);

		const testFile = join(tempDir, "test.ts");
		const outFile = join(tempDir, "test.cjs");
		const arkenvNodeModules = join(tempDir, "node_modules", "arkenv");

		// Setup arkenv in node_modules
		mkdirSync(arkenvNodeModules, { recursive: true });
		// Copy package.json and dist
		cpSync(
			join(projectRoot, "package.json"),
			join(arkenvNodeModules, "package.json"),
		);
		cpSync(join(projectRoot, "dist"), join(arkenvNodeModules, "dist"), {
			recursive: true,
		});

		// Create a package.json in the temp dir to force ESM mode (like the real project)
		writeFileSync(
			join(tempDir, "package.json"),
			JSON.stringify({ name: "test-project", type: "module" }),
		);

		// Create a test script
		writeFileSync(
			testFile,
			`import arkenv from "arkenv";
const env = arkenv({});
console.log('SUCCESS');
`,
		);

		// Bundle it with esbuild as CJS, marking arkenv as external
		execSync(
			`${esbuildPath} ${testFile} --bundle --format=cjs --platform=node --external:arkenv --outfile=${outFile}`,
			{ cwd: tempDir, stdio: "ignore" },
		);

		// Run the bundled output
		try {
			const output = execSync(`node ${outFile}`, {
				encoding: "utf8",
				cwd: tempDir,
			});
			expect(output.trim()).toBe("SUCCESS");
		} catch (e) {
			const error = e as { stdout?: string; stderr?: string; message: string };
			const message = error.stdout || error.stderr || error.message;
			throw new Error(`External bundle test failed: ${message}`);
		} finally {
			// Cleanup
			if (existsSync(tempDir)) {
				rmSync(tempDir, { recursive: true, force: true });
			}
		}
	});

	it("should work when arkenv/standard is external in an ESM bundle (no ArkType needed)", () => {
		const tempDir = mkdtempSync(
			join(tmpdir(), `arkenv-esm-interop-test-${randomUUID()}`),
		);

		const testFile = join(tempDir, "test.ts");
		const outFile = join(tempDir, "test.mjs");
		const arkenvNodeModules = join(tempDir, "node_modules", "arkenv");

		// Setup arkenv in node_modules
		mkdirSync(arkenvNodeModules, { recursive: true });
		cpSync(
			join(projectRoot, "package.json"),
			join(arkenvNodeModules, "package.json"),
		);
		cpSync(join(projectRoot, "dist"), join(arkenvNodeModules, "dist"), {
			recursive: true,
		});

		// Create a package.json in the temp dir
		writeFileSync(
			join(tempDir, "package.json"),
			JSON.stringify({ name: "test-project", type: "module" }),
		);

		// Create a test script using the standard entry (ArkType-free)
		writeFileSync(
			testFile,
			`import { createEnv } from "arkenv/standard";
const schema = { PORT: { "~standard": { version: 1, validate: (v) => ({ value: v }) } } };
const env = createEnv(schema, { env: { PORT: "3000" } });
console.log('SUCCESS');
`,
		);

		// Bundle it with esbuild as ESM, marking arkenv as external
		execSync(
			`${esbuildPath} ${testFile} --bundle --format=esm --platform=node --external:arkenv --outfile=${outFile}`,
			{ cwd: tempDir, stdio: "ignore" },
		);

		// Assert the bundle contains no arktype references (isolation invariant)
		const bundleContents = readFileSync(outFile, "utf8");
		expect(bundleContents).not.toContain("arktype");

		// Run the bundled output — arktype must NOT be required for this to work
		try {
			const output = execSync(`node ${outFile}`, {
				encoding: "utf8",
				cwd: tempDir,
			});
			expect(output.trim()).toBe("SUCCESS");
		} catch (e) {
			const error = e as { stdout?: string; stderr?: string; message: string };
			const message = error.stdout || error.stderr || error.message;
			throw new Error(`External ESM bundle test failed: ${message}`);
		} finally {
			// Cleanup
			if (existsSync(tempDir)) {
				rmSync(tempDir, { recursive: true, force: true });
			}
		}
	});
});
