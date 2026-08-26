import { describe, expect, it } from "vitest";
import {
	CAPTURE_CONTRACT_HINT,
	CAPTURE_UPGRADE_HINT,
	formatModuleLoadFailedMessage,
	formatNoSchemaMessage,
	isCaptureStubReadCause,
	isEnvValidationCause,
} from "./schema-load-errors";

describe("schema load error messages", () => {
	it("hints at a library upgrade when no arkenv() call was captured", () => {
		expect(formatNoSchemaMessage("/tmp/env.ts")).toContain(
			CAPTURE_UPGRADE_HINT,
		);
	});

	it("hints at a library upgrade when validation ran instead of capture", () => {
		const cause = Object.assign(
			new Error("Errors found while validating environment variables"),
			{
				name: "ArkEnvError",
			},
		);
		expect(isEnvValidationCause(cause)).toBe(true);
		expect(formatModuleLoadFailedMessage("/tmp/env.ts", cause)).toContain(
			CAPTURE_UPGRADE_HINT,
		);
	});

	it("hints at the capture contract when the module reads env at load time", () => {
		expect(
			isCaptureStubReadCause(
				new TypeError("Cannot read properties of undefined"),
			),
		).toBe(true);
		expect(
			formatModuleLoadFailedMessage(
				"/tmp/env.ts",
				new Error("missing DATABASE_URL"),
			),
		).toContain(CAPTURE_CONTRACT_HINT);
	});
});
