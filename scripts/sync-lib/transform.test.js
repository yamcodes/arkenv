import { describe, expect, it } from "vitest";
import { transformPackageJson } from "./transform.js";

describe("transformPackageJson", () => {
	it("reads version from catalog", () => {
		const catalog = {};
		catalog["npm"] = "12.0.2";
		const cfg = { name: "basic" };
		cfg["packageManager"] = "npm";
		const result = transformPackageJson({ name: "playground" }, cfg, catalog);
		expect(result["packageManager"]).toBe("npm" + "@" + "12.0.2");
		expect(result.name).toBe("arkenv-example-basic");
	});

	it("sets bun from catalog", () => {
		const catalog = {};
		catalog["bun"] = "1.4.0";
		const cfg = { name: "with-bun" };
		cfg["packageManager"] = "bun";
		const result = transformPackageJson({ name: "playground" }, cfg, catalog);
		expect(result["packageManager"]).toBe("bun" + "@" + "1.4.0");
	});

	it("throws when missing from catalog", () => {
		const cfg = { name: "basic" };
		cfg["packageManager"] = "npm";
		expect(() => transformPackageJson({ name: "playground" }, cfg, {})).toThrow(
			/not found in workspace catalog/,
		);
	});
});
