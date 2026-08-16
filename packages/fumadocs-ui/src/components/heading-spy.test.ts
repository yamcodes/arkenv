import { describe, expect, it } from "vitest";
import { getActiveHeadingId } from "./heading-spy";

describe("getActiveHeadingId", () => {
	it("returns undefined when there are no headings", () => {
		expect(getActiveHeadingId([], 128)).toBeUndefined();
	});

	it("selects the first heading when every heading is still below the spy line", () => {
		expect(
			getActiveHeadingId(
				[
					{ id: "intro", top: 200 },
					{ id: "issue-codes", top: 640 },
				],
				128,
			),
		).toBe("intro");
	});

	it("selects the topmost heading on the spy line when a later section is also on screen", () => {
		expect(
			getActiveHeadingId(
				[
					{ id: "issue-codes", top: 128 },
					{ id: "secret-redaction", top: 520 },
					{ id: "safe-mode", top: 900 },
				],
				128,
			),
		).toBe("issue-codes");
	});

	it("keeps the current section while its heading has scrolled above the spy line", () => {
		expect(
			getActiveHeadingId(
				[
					{ id: "issue-codes", top: -40 },
					{ id: "secret-redaction", top: 400 },
				],
				128,
			),
		).toBe("issue-codes");
	});

	it("moves to the next section once that heading reaches the spy line", () => {
		expect(
			getActiveHeadingId(
				[
					{ id: "issue-codes", top: -360 },
					{ id: "secret-redaction", top: 128 },
				],
				128,
			),
		).toBe("secret-redaction");
	});
});
