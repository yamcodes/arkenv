import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { describe, expect, it } from "vitest";

describe("client entry bundle isolation", () => {
	it("does not include @arkenv/core or arktype in the client package entry", async () => {
		const outfile = path.resolve(__dirname, "temp-client-bundle.mjs");

		try {
			await build({
				entryPoints: [path.resolve(__dirname, "client.ts")],
				bundle: true,
				write: true,
				outfile,
				format: "esm",
				platform: "browser",
				packages: "bundle",
				external: [
					"#arkenv/shared-schema",
					"#arkenv/client-env",
					"#arkenv/server-boot",
				],
				logLevel: "silent",
			});

			const code = fs.readFileSync(outfile, "utf8");
			expect(code).not.toMatch(/@arkenv\/core/);
			expect(code).not.toMatch(/from\s*["']arktype["']/);
			expect(code).not.toMatch(/require\(["']arktype["']\)/);
			expect(code).not.toMatch(/createEnv|arktype/);
		} finally {
			fs.rmSync(outfile, { force: true });
		}
	});
});
