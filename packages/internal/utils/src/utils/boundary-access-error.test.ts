import { describe, expect, it } from "vitest";
import { ArkEnvValidationError } from "../core";
import {
	ARKENV_ACCESS_ERROR_NAME,
	boundaryAccessErrorMessage,
	createBoundaryAccessError,
} from "./boundary-access-error";

describe("createBoundaryAccessError", () => {
	it("brands a native Error without constructing ArkEnvValidationError", () => {
		const error = createBoundaryAccessError("DATABASE_URL");
		expect(error).toBeInstanceOf(Error);
		expect(error).not.toBeInstanceOf(ArkEnvValidationError);
		expect(error.name).toBe(ARKENV_ACCESS_ERROR_NAME);
		expect(error.message).toBe(boundaryAccessErrorMessage("DATABASE_URL"));
		expect(String(error)).toMatch(
			/^ArkEnvAccessError: Attempted to access server environment variable 'DATABASE_URL' on the client\./,
		);
		expect(error.stack).toMatch(/^ArkEnvAccessError:/);
	});
});
