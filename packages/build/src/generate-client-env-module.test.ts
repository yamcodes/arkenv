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
			"Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
		);
		expect(code).not.toContain("error.name");
		expect(code).not.toContain("ArkEnvAccessError");
		expect(code).not.toContain("ArkEnv Error:");
		expect(code).not.toMatch(/import\b.*ArkEnvValidationError/);
		expect(code).not.toContain("arktype");
	});
});
