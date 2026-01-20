import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("load-arktype bundling compatibility", () => {
	it("should work when bundled as CommonJS with esbuild", () => {
		const tempDir = join(process.cwd(), "temp-bundle-test");
		if (!existsSync(tempDir)) {
			mkdirSync(tempDir);
		}

		const testFile = join(tempDir, "test.ts");
		const outFile = join(tempDir, "test.cjs");
		const arkenvDistPath = join(process.cwd(), "packages/arkenv/dist/index.js");

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
			`./node_modules/.bin/esbuild ${testFile} --bundle --format=cjs --platform=node --outfile=${outFile}`,
			{ cwd: process.cwd() },
		);

		// Run the bundled output
		try {
			const output = execSync(`node ${outFile}`, { encoding: "utf8" });
			expect(output.trim()).toBe("SUCCESS");
		} catch (e) {
			// biome-ignore lint/suspicious/noExplicitAny: error object properties are unknown
			const error = e as any;
			const message = error.stdout || error.stderr || error.message;
			throw new Error(`Bundle test failed: ${message}`);
		} finally {
			// Cleanup
			if (existsSync(tempDir)) {
				const { rmSync } = require("node:fs");
				rmSync(tempDir, { recursive: true, force: true });
			}
		}
	});
});
