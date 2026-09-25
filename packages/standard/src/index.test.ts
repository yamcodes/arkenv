import { describe, expect, expectTypeOf, it } from "vitest";
import type { EnvIssue, EnvIssueCode, EnvIssueMeta } from "./issues";

type RootModule = typeof import("./index");
type IssuesModule = typeof import("./issues");
type ValueHelpers = "formatIssues" | "getSchemaKeys";

describe("@arkenv/standard root", () => {
	it("does not re-export formatIssues, getSchemaKeys, or EnvIssue from the main barrel", async () => {
		const mod = await import("./index");
		expect("formatIssues" in mod).toBe(false);
		expect("getSchemaKeys" in mod).toBe(false);
		expect("EnvIssue" in mod).toBe(false);
		expect("arkenv" in mod).toBe(true);
		expect("ArkEnvError" in mod).toBe(true);
		expectTypeOf<Extract<keyof RootModule, ValueHelpers>>().toBeNever();
	});

	it("exports issue helpers from @arkenv/standard/issues", async () => {
		const issues = await import("./issues");
		expect(typeof issues.formatIssues).toBe("function");
		expect(typeof issues.getSchemaKeys).toBe("function");
		expectTypeOf<
			Extract<keyof IssuesModule, ValueHelpers>
		>().toEqualTypeOf<ValueHelpers>();
		expectTypeOf<EnvIssue["code"]>().toEqualTypeOf<EnvIssueCode>();
		expectTypeOf<EnvIssue["meta"]>().toEqualTypeOf<EnvIssueMeta | undefined>();
	});

	it("does not re-export issue helpers from /valibot or /zod-mini", async () => {
		const valibot = await import("./valibot");
		const zodMini = await import("./zod-mini");
		expect("formatIssues" in valibot).toBe(false);
		expect("getSchemaKeys" in valibot).toBe(false);
		expect("formatIssues" in zodMini).toBe(false);
		expect("getSchemaKeys" in zodMini).toBe(false);
		expect("ArkEnvError" in valibot).toBe(true);
		expect("ArkEnvError" in zodMini).toBe(true);
	});
});
