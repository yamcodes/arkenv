import { afterEach, describe, expect, it, vi } from "vitest";
import { createEnv } from "./create-env";
import { type } from "./type";

describe("createEnv + type + scope + types integration", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("string.host integration", () => {
		it("should validate localhost through createEnv", () => {
			vi.stubEnv("HOST", "localhost");

			const env = createEnv({
				HOST: type("string.host"),
			});

			expect(env.HOST).toBe("localhost");
		});

		it("should validate IP address through createEnv", () => {
			vi.stubEnv("HOST", "127.0.0.1");

			const env = createEnv({
				HOST: type("string.host"),
			});

			expect(env.HOST).toBe("127.0.0.1");
		});

		it("should throw ArkEnvError for invalid host through createEnv", () => {
			vi.stubEnv("HOST", "invalid-host");

			expect(() =>
				createEnv({
					HOST: type("string.host"),
				}),
			).toThrow(/HOST/);
		});
	});

	describe("number.port integration", () => {
		it("should validate valid port through createEnv", () => {
			vi.stubEnv("PORT", "8080");

			const env = createEnv({
				PORT: type("number.port"),
			});

			expect(env.PORT).toBe(8080);
			expect(typeof env.PORT).toBe("number");
		});

		it("should validate port at boundary (0) through createEnv", () => {
			vi.stubEnv("PORT", "0");

			const env = createEnv({
				PORT: type("number.port"),
			});

			expect(env.PORT).toBe(0);
		});

		it("should validate port at boundary (65535) through createEnv", () => {
			vi.stubEnv("PORT", "65535");

			const env = createEnv({
				PORT: type("number.port"),
			});

			expect(env.PORT).toBe(65535);
		});

		it("should throw ArkEnvError for invalid port through createEnv", () => {
			vi.stubEnv("PORT", "99999");

			expect(() =>
				createEnv({
					PORT: type("number.port"),
				}),
			).toThrow(/PORT/);
		});

		it("should throw ArkEnvError for non-numeric port through createEnv", () => {
			vi.stubEnv("PORT", "not-a-number");

			expect(() =>
				createEnv({
					PORT: type("number.port"),
				}),
			).toThrow(/PORT/);
		});
	});

	describe("boolean integration", () => {
		it("should validate 'true' string through createEnv", () => {
			vi.stubEnv("DEBUG", "true");

			const env = createEnv({
				DEBUG: type("boolean"),
			});

			expect(env.DEBUG).toBe(true);
			expect(typeof env.DEBUG).toBe("boolean");
		});

		it("should validate 'false' string through createEnv", () => {
			vi.stubEnv("DEBUG", "false");

			const env = createEnv({
				DEBUG: type("boolean"),
			});

			expect(env.DEBUG).toBe(false);
		});

		it("should throw ArkEnvError for invalid boolean through createEnv", () => {
			vi.stubEnv("DEBUG", "maybe");

			expect(() =>
				createEnv({
					DEBUG: type("boolean"),
				}),
			).toThrow(/DEBUG/);
		});
	});

	describe("multiple custom types together", () => {
		it("should validate host, port, and boolean together", () => {
			vi.stubEnv("HOST", "localhost");
			vi.stubEnv("PORT", "3000");
			vi.stubEnv("DEBUG", "true");

			const env = createEnv({
				HOST: type("string.host"),
				PORT: type("number.port"),
				DEBUG: type("boolean"),
			});

			expect(env.HOST).toBe("localhost");
			expect(env.PORT).toBe(3000);
			expect(env.DEBUG).toBe(true);
		});

		it("should validate IP address with port and boolean", () => {
			vi.stubEnv("HOST", "192.168.1.1");
			vi.stubEnv("PORT", "8080");
			vi.stubEnv("DEBUG", "false");

			const env = createEnv({
				HOST: type("string.host"),
				PORT: type("number.port"),
				DEBUG: type("boolean"),
			});

			expect(env.HOST).toBe("192.168.1.1");
			expect(env.PORT).toBe(8080);
			expect(env.DEBUG).toBe(false);
		});

		it("should throw ArkEnvError when one custom type fails", () => {
			vi.stubEnv("HOST", "localhost");
			vi.stubEnv("PORT", "99999"); // Invalid port
			vi.stubEnv("DEBUG", "true");

			expect(() =>
				createEnv({
					HOST: type("string.host"),
					PORT: type("number.port"),
					DEBUG: type("boolean"),
				}),
			).toThrow(/PORT/);
		});

		it("should throw ArkEnvError when multiple custom types fail", () => {
			vi.stubEnv("HOST", "invalid-host");
			vi.stubEnv("PORT", "99999");
			vi.stubEnv("DEBUG", "maybe");

			expect(() =>
				createEnv({
					HOST: type("string.host"),
					PORT: type("number.port"),
					DEBUG: type("boolean"),
				}),
			).toThrow();
		});
	});

	describe("custom types with defaults", () => {
		it("should use default value for host when missing", () => {
			const env = createEnv({
				HOST: type("string.host").default(() => "localhost"),
			});

			expect(env.HOST).toBe("localhost");
		});

		it("should use default value for port when missing", () => {
			const env = createEnv({
				PORT: type("number.port").default(3000),
			});

			expect(env.PORT).toBe(3000);
		});

		it("should use default value for boolean when missing", () => {
			const env = createEnv({
				DEBUG: type("boolean").default(() => false),
			});

			expect(env.DEBUG).toBe(false);
		});

		it("should validate custom type when provided instead of using default", () => {
			vi.stubEnv("HOST", "127.0.0.1");

			const env = createEnv({
				HOST: type("string.host").default(() => "localhost"),
			});

			expect(env.HOST).toBe("127.0.0.1");
		});
	});
});
