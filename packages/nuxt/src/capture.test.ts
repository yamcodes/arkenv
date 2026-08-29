import { afterEach, describe, expect, it } from "vitest";
import {
	beginCapture,
	combineCapturedSchemas,
	createCaptureStub,
	endCapture,
	isCapturing,
	publicKeysFromCaptures,
	recordCapture,
} from "./capture";
import { ENV_KEYS, EXTENDED_ENV, SERVER_ONLY_KEYS } from "./schema-shape";

const NUXT_CAPTURE_SYMBOL = Symbol.for("arkenv.nuxt.schemaCapture.v1");
const LEGACY_STRING_KEY = "__ARKENV_SCHEMA_CAPTURE__";

afterEach(() => {
	endCapture();
	delete (globalThis as Record<string | symbol, unknown>)[NUXT_CAPTURE_SYMBOL];
	delete (globalThis as Record<string | symbol, unknown>)[LEGACY_STRING_KEY];
});

describe("Nuxt capture state & Symbol isolation", () => {
	it("stores capture state on Symbol.for('arkenv.nuxt.schemaCapture.v1')", () => {
		expect(
			(globalThis as Record<string | symbol, unknown>)[NUXT_CAPTURE_SYMBOL],
		).toBeUndefined();

		beginCapture();

		const symbolState = (globalThis as Record<string | symbol, unknown>)[
			NUXT_CAPTURE_SYMBOL
		] as { capturing: boolean; captures: unknown[] };

		expect(symbolState).toBeDefined();
		expect(symbolState.capturing).toBe(true);
		expect(symbolState.captures).toEqual([]);

		recordCapture({ PORT: "number" }, undefined, undefined);
		expect(symbolState.captures).toHaveLength(1);

		const captured = endCapture();
		expect(captured).toHaveLength(1);
		expect(symbolState.capturing).toBe(false);
	});

	it("never reads or writes the legacy string key __ARKENV_SCHEMA_CAPTURE__", () => {
		expect(
			(globalThis as Record<string | symbol, unknown>)[LEGACY_STRING_KEY],
		).toBeUndefined();

		beginCapture();
		recordCapture({ DATABASE_URL: "string" }, undefined, undefined);
		endCapture();

		expect(
			(globalThis as Record<string | symbol, unknown>)[LEGACY_STRING_KEY],
		).toBeUndefined();
	});

	it("remains isolated when legacy string key __ARKENV_SCHEMA_CAPTURE__ is set by CLI / other tools", () => {
		// Simulate CLI / legacy string bag on globalThis
		(globalThis as Record<string | symbol, unknown>)[LEGACY_STRING_KEY] = {
			capturing: true,
			definitions: [{ FOO: "string" }],
		};

		// Nuxt capture should be inactive
		expect(isCapturing()).toBe(false);

		// Begin Nuxt capture
		beginCapture();
		expect(isCapturing()).toBe(true);

		// Record a Nuxt capture
		recordCapture({ NUXT_PUBLIC_API_URL: "string" }, undefined, undefined);

		// CLI state should be unchanged
		const cliState = (globalThis as Record<string | symbol, unknown>)[
			LEGACY_STRING_KEY
		] as { capturing: boolean; definitions: unknown[] };
		expect(cliState.capturing).toBe(true);
		expect(cliState.definitions).toEqual([{ FOO: "string" }]);

		// End Nuxt capture
		const nuxtCaptures = endCapture();
		expect(nuxtCaptures).toHaveLength(1);
		expect(nuxtCaptures[0]?.schemaOrOptions).toEqual({
			NUXT_PUBLIC_API_URL: "string",
		});
		expect(isCapturing()).toBe(false);

		// CLI state is still untouched
		expect(cliState.capturing).toBe(true);
		expect(cliState.definitions).toEqual([{ FOO: "string" }]);
	});

	it("combines captured schemas correctly", () => {
		const calls = [
			{
				schemaOrOptions: { DATABASE_URL: "string" },
				optionsOrIsServer: undefined,
				context: { isServer: true },
			},
			{
				schemaOrOptions: { NUXT_PUBLIC_KEY: "string" },
				optionsOrIsServer: undefined,
				context: { isServer: true },
			},
		];

		const combined = combineCapturedSchemas(calls);
		expect(combined).toEqual({
			DATABASE_URL: "string",
			NUXT_PUBLIC_KEY: "string",
		});
	});

	it("collects public keys from captured calls", () => {
		const calls = [
			{
				schemaOrOptions: { DATABASE_URL: "string", NUXT_PUBLIC_KEY: "string" },
				optionsOrIsServer: undefined,
				context: { isServer: true },
			},
			{
				schemaOrOptions: { NODE_ENV: "string" },
				optionsOrIsServer: undefined,
				context: { isServer: true },
			},
		];

		const publicKeys = publicKeysFromCaptures(calls);
		expect(publicKeys.has("NUXT_PUBLIC_KEY")).toBe(true);
		expect(publicKeys.has("NODE_ENV")).toBe(true);
		expect(publicKeys.has("DATABASE_URL")).toBe(false);
	});

	it("creates a capture proxy stub with declared keys", () => {
		const stub = createCaptureStub([
			"DATABASE_URL",
			"NUXT_PUBLIC_PORT",
		]) as Record<string | symbol, unknown>;

		expect(stub[EXTENDED_ENV]).toBeDefined();
		expect(stub[ENV_KEYS]).toEqual(
			new Set(["DATABASE_URL", "NUXT_PUBLIC_PORT"]),
		);
		expect(stub[SERVER_ONLY_KEYS]).toEqual(new Set<string>());

		expect(stub.DATABASE_URL).toBeUndefined();
		expect(stub.NUXT_PUBLIC_PORT).toBeUndefined();
		expect(stub.UNKNOWN_KEY).toBeUndefined();

		expect("DATABASE_URL" in stub).toBe(true);
		expect("NUXT_PUBLIC_PORT" in stub).toBe(true);
		expect("UNKNOWN_KEY" in stub).toBe(false);

		expect(Object.keys(stub)).toEqual(["DATABASE_URL", "NUXT_PUBLIC_PORT"]);
		expect(Object.getOwnPropertyDescriptor(stub, "DATABASE_URL")).toMatchObject(
			{
				configurable: true,
				enumerable: true,
				writable: false,
				value: undefined,
			},
		);
		expect(
			Object.getOwnPropertyDescriptor(stub, "UNKNOWN_KEY"),
		).toBeUndefined();
	});
});
