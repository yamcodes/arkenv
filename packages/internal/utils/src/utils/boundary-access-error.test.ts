import { describe, expect, it } from "vitest";
import { ArkEnvError } from "../core";
import {
	ARKENV_ERROR_NAME,
	boundaryAccessErrorMessage,
	createBoundaryAccessError,
} from "./boundary-access-error";

describe("createBoundaryAccessError", () => {
	it("brands a native Error without constructing ArkEnvError", () => {
		const error = createBoundaryAccessError("DATABASE_URL");
		expect(error).toBeInstanceOf(Error);
		expect(error).not.toBeInstanceOf(ArkEnvError);
		expect(error.name).toBe(ARKENV_ERROR_NAME);
		expect(error.message).toBe(boundaryAccessErrorMessage("DATABASE_URL"));
		expect(String(error)).toMatch(
			/^ArkEnvError: Attempted to access server environment variable 'DATABASE_URL' on the client\./,
		);
	});
});
