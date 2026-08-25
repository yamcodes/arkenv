import { describe, expect, it } from "vitest";
import { filterEnvByPrefix } from "./filter-env";

describe("filterEnvByPrefix", () => {
	it("filters by a single prefix", () => {
		const raw = {
			VITE_API_URL: "https://example.com",
			DATABASE_URL: "postgres://localhost",
			SECRET: "123",
		};
		const filtered = filterEnvByPrefix(raw, "VITE_");
		expect(filtered).toEqual({
			VITE_API_URL: "https://example.com",
		});
	});

	it("filters by multiple prefixes", () => {
		const raw = {
			VITE_API_URL: "https://example.com",
			PUBLIC_CDN: "https://cdn.example.com",
			DATABASE_URL: "postgres://localhost",
		};
		const filtered = filterEnvByPrefix(raw, ["VITE_", "PUBLIC_"]);
		expect(filtered).toEqual({
			VITE_API_URL: "https://example.com",
			PUBLIC_CDN: "https://cdn.example.com",
		});
	});

	it("preserves explicitly allowed keys regardless of prefix", () => {
		const raw = {
			BUN_PUBLIC_KEY: "abc",
			NODE_ENV: "production",
			PORT: "3000",
		};
		const filtered = filterEnvByPrefix(raw, "BUN_PUBLIC_", ["NODE_ENV"]);
		expect(filtered).toEqual({
			BUN_PUBLIC_KEY: "abc",
			NODE_ENV: "production",
		});
	});

	it("handles Set for allowedKeys", () => {
		const raw = {
			BUN_PUBLIC_KEY: "abc",
			NODE_ENV: "production",
			PORT: "3000",
		};
		const filtered = filterEnvByPrefix(
			raw,
			"BUN_PUBLIC_",
			new Set(["NODE_ENV"]),
		);
		expect(filtered).toEqual({
			BUN_PUBLIC_KEY: "abc",
			NODE_ENV: "production",
		});
	});
});
