import { describe, expect, it } from "vitest";
import { ArkEnvValidationError } from "../core";
import { boundaryAccessErrorMessage } from "./boundary-access-error";

describe("boundaryAccessErrorMessage", () => {
	it("attributes a native Error without constructing ArkEnvValidationError", () => {
		const error = new Error(boundaryAccessErrorMessage("DATABASE_URL"));
		expect(error).toBeInstanceOf(Error);
		expect(error).not.toBeInstanceOf(ArkEnvValidationError);
		expect(error.name).toBe("Error");
		expect(error.message).toBe(
			"Access to server-only key 'DATABASE_URL' on the client was prevented by ArkEnv",
		);
		expect(String(error)).toMatch(
			/^Error: Access to server-only key 'DATABASE_URL' on the client was prevented by ArkEnv$/,
		);
		expect(error.stack).toMatch(/^Error:/);
	});
});
