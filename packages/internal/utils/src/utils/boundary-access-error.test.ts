import { describe, expect, it } from "vitest";
import { ArkEnvValidationError } from "../core";
import {
	boundaryAccessErrorMessage,
	createBoundaryAccessError,
} from "./boundary-access-error";

describe("createBoundaryAccessError", () => {
	it("throws a native Error without constructing ArkEnvValidationError", () => {
		const error = createBoundaryAccessError("DATABASE_URL");
		expect(error).toBeInstanceOf(Error);
		expect(error).not.toBeInstanceOf(ArkEnvValidationError);
		expect(error.name).toBe("Error");
		expect(error.message).toBe(boundaryAccessErrorMessage("DATABASE_URL"));
		expect(String(error)).toMatch(
			/^Error: Access to server-only key 'DATABASE_URL' on the client was prevented by ArkEnv$/,
		);
		expect(error.stack).toMatch(/^Error:/);
	});
});
