import { describe, expect, it } from "vitest";
import { generateClientEnvModule } from "./generate-client-env-module";

describe("generateClientEnvModule", () => {
	it("inlines literals and import-free branded server-key getters", () => {
		const code = generateClientEnvModule(
			{ VITE_API_URL: "https://api.example.com" },
			["DATABASE_URL"],
		);

		expect(code).toContain('"VITE_API_URL": "https://api.example.com"');
		expect(code).toContain('get ["DATABASE_URL"]()');
		expect(code).toContain(
			"Attempted to access server environment variable 'DATABASE_URL' on the client",
		);
		expect(code).toContain('error.name = "ArkEnvError"');
		expect(code).not.toContain("ArkEnv Error:");
		expect(code).not.toMatch(/import\b.*ArkEnvError/);
		expect(code).not.toContain("arktype");
	});
});
