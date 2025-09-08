import { describe, expect, it } from "vitest";
import { $ } from "./scope";

describe("scope", () => {
	it("should validate string.host", () => {
		const hostType = $.type({ HOST: "string.host" });
		const result = hostType.assert({ HOST: "127.0.0.1" });
		expect(result.HOST).toBe("127.0.0.1");
	});

	it("should validate localhost as string.host", () => {
		const hostType = $.type({ HOST: "string.host" });
		const result = hostType.assert({ HOST: "localhost" });
		expect(result.HOST).toBe("localhost");
	});

	it("should throw for invalid host", () => {
		const hostType = $.type({ HOST: "string.host" });
		expect(() => hostType.assert({ HOST: "invalid-host" })).toThrow();
	});

	it("should validate number.port", () => {
		const portType = $.type({ PORT: "number.port" });
		const result = portType.assert({ PORT: "8080" });
		expect(result.PORT).toBe(8080);
	});

	it("should throw for invalid port", () => {
		const portType = $.type({ PORT: "number.port" });
		expect(() => portType.assert({ PORT: "99999" })).toThrow();
	});

	it("should validate combined host and port", () => {
		const envType = $.type({
			HOST: "string.host",
			PORT: "number.port",
		});
		const result = envType.assert({
			HOST: "localhost",
			PORT: "3000",
		});
		expect(result.HOST).toBe("localhost");
		expect(result.PORT).toBe(3000);
	});

	it("should work with regular string types", () => {
		const stringType = $.type({ NODE_ENV: "string" });
		const result = stringType.assert({ NODE_ENV: "development" });
		expect(result.NODE_ENV).toBe("development");
	});
});
