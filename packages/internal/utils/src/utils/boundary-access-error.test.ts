import { describe, expect, it } from "vitest";
import { ArkEnvError } from "../core";
import { boundaryAccessErrorMessage } from "./boundary-access-error";

describe("boundaryAccessErrorMessage", () => {
	it("builds a native Error without constructing ArkEnvError", () => {
		const error = new Error(boundaryAccessErrorMessage("DATABASE_URL"));
		expect(error).toBeInstanceOf(Error);
		expect(error).not.toBeInstanceOf(ArkEnvError);
		expect(error.name).toBe("Error");
		expect(error.message).toBe(
			"Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
		);
		expect(String(error)).toBe(
			"Error: Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
		);
		expect(error.stack).toMatch(/^Error:/);
	});
});
