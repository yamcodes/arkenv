import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("load-arktype bundling compatibility", () => {
	it("should work when bundled as CommonJS with esbuild", () => {
		const tempDir = mkdtempSync(
			join(tmpdir(), `arkenv-bundle-test-${randomUUID()}`),
		);

		const testFile = join(tempDir, "test.ts");
		const outFile = join(tempDir, "test.cjs");

		// Find the package root (arkenv/packages/arkenv)
		const projectRoot = process.cwd().includes("packages/arkenv")
			? process.cwd()
			: join(process.cwd(), "packages/arkenv");

		const arkenvDistPath = join(projectRoot, "dist/index.mjs");
		const esbuildPath = join(projectRoot, "../../node_modules/.bin/esbuild");

		// Create a small script that uses the ESM version of arkenv
		writeFileSync(
			testFile,
			`import arkenv from ${JSON.stringify(arkenvDistPath)};
try {
  // Use default validator mode to trigger loadArkTypeValidator()
  const env = arkenv({ PORT: 'number.port' }, { 
    env: { PORT: '3000' }
  });
  console.log('SUCCESS');
} catch (e) {
  if (e.message.includes("The 'arktype' package is required")) {
    console.log('SUCCESS'); // We expect this if arktype is not in the temp dir
  } else {
    console.error(e);
    process.exit(1);
  }
}`,
		);

		// Bundle it with esbuild as CJS
		execSync(
			`${esbuildPath} ${testFile} --bundle --format=cjs --platform=node --outfile=${outFile}`,
			{ cwd: projectRoot, stdio: "ignore" },
		);

		// Run the bundled output
		try {
			const output = execSync(`node ${outFile}`, { encoding: "utf8" });
			expect(output.trim()).toBe("SUCCESS");
		} catch (e) {
			const error = e as { stdout?: string; stderr?: string; message: string };
			const message = error.stdout || error.stderr || error.message;
			throw new Error(`Bundle test failed: ${message}`);
		} finally {
			// Cleanup
			if (existsSync(tempDir)) {
				rmSync(tempDir, { recursive: true, force: true });
			}
		}
	});

	it("should bundle for browser without resolving node:module (issue #791)", () => {
		const tempDir = mkdtempSync(
			join(tmpdir(), `arkenv-bundle-test-${randomUUID()}`),
		);

		const testFile = join(tempDir, "test.ts");
		const outFile = join(tempDir, "test.js");

		// Find the package root (arkenv/packages/arkenv)
		const projectRoot = process.cwd().includes("packages/arkenv")
			? process.cwd()
			: join(process.cwd(), "packages/arkenv");

		const arkenvDistPath = join(projectRoot, "dist/index.mjs");
		const esbuildPath = join(projectRoot, "../../node_modules/.bin/esbuild");

		// Create a small script that imports arkenv
		writeFileSync(
			testFile,
			`import arkenv from ${JSON.stringify(arkenvDistPath)};
console.log(typeof arkenv);`,
		);

		try {
			// Bundle with esbuild targeting browser platform
			execSync(
				`${esbuildPath} ${testFile} --bundle --format=esm --platform=browser --outfile=${outFile}`,
				{ cwd: projectRoot, stdio: "pipe", encoding: "utf8" },
			);
		} catch (e) {
			const error = e as { stdout?: string; stderr?: string; message: string };
			const message = error.stderr || error.stdout || error.message;
			throw new Error(`Browser bundle failed (issue #791): ${message}`);
		} finally {
			// Cleanup
			if (existsSync(tempDir)) {
				rmSync(tempDir, { recursive: true, force: true });
			}
		}
	});
});
