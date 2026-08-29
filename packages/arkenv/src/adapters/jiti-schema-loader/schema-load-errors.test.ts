import { describe, expect, it } from "vitest";
import {
	CAPTURE_CONTRACT_HINT,
	CAPTURE_NO_CALL_HINT,
	CAPTURE_UNEXTRACTABLE_HINT,
	CAPTURE_UPGRADE_HINT,
	formatEvalThrowMessage,
	formatNoCallMessage,
	formatUnextractableMessage,
	formatUnsupportedMessage,
	isCaptureStubReadCause,
	isEnvValidationCause,
} from "./schema-load-errors";

describe("schema load error messages", () => {
	it("hints at a top-level arkenv() call when none was captured", () => {
		expect(formatNoCallMessage("/tmp/env.ts")).toContain(CAPTURE_NO_CALL_HINT);
		expect(formatNoCallMessage("/tmp/env.ts")).not.toContain(
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
		expect(formatUnsupportedMessage("/tmp/env.ts", cause)).toContain(
			CAPTURE_UPGRADE_HINT,
		);
	});

	it("hints when a captured definition cannot be read as keys", () => {
		expect(formatUnextractableMessage("/tmp/env.ts")).toContain(
			CAPTURE_UNEXTRACTABLE_HINT,
		);
	});

	it("hints at the capture contract when the module reads env at load time", () => {
		expect(
			isCaptureStubReadCause(
				new TypeError("Cannot read properties of undefined"),
			),
		).toBe(true);
		expect(
			formatEvalThrowMessage("/tmp/env.ts", new Error("missing DATABASE_URL")),
		).toContain(CAPTURE_CONTRACT_HINT);
	});
});
