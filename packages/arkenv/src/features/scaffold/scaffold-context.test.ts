import { describe, expect, it } from "vitest";
import {
	CODEGEN_FRAMEWORK_CONFIGS,
	FRAMEWORK_CLIENT_PREFIXES,
	FRAMEWORKS,
} from "./frameworks";
import type { Framework, ProjectOptions } from "./plan";
import { createScaffoldContext } from "./scaffold-context";

const EXPECTED_CLIENT_PREFIXES = {
	nextjs: "NEXT_PUBLIC_",
	nuxt: "NUXT_PUBLIC_",
	vite: "VITE_",
	"bun-fullstack": "BUN_PUBLIC_",
	vanilla: "",
} as const satisfies Record<Framework, string>;

/**
 * Build minimal project options for context creation tests.
 *
 * @param framework The framework under test
 * @returns Project options sufficient for {@link createScaffoldContext}
 */
function optionsFor(framework: Framework): ProjectOptions {
	return {
		path: "src/env.ts",
		validator: "arktype",
		framework,
		language: "ts",
	};
}

describe("framework clientPrefix", () => {
	it.each(
		Object.entries(EXPECTED_CLIENT_PREFIXES) as [Framework, string][],
	)("exposes %s as %j on the framework strategy", (framework, prefix) => {
		expect(FRAMEWORKS[framework].clientPrefix).toBe(prefix);
		expect(FRAMEWORK_CLIENT_PREFIXES[framework]).toBe(prefix);
	});

	it("sources Next.js and Nuxt prefixes from codegen config", () => {
		expect(FRAMEWORKS.nextjs.clientPrefix).toBe(
			CODEGEN_FRAMEWORK_CONFIGS.nextjs.clientPrefix,
		);
		expect(FRAMEWORKS.nuxt.clientPrefix).toBe(
			CODEGEN_FRAMEWORK_CONFIGS.nuxt.clientPrefix,
		);
		expect(FRAMEWORK_CLIENT_PREFIXES.nextjs).toBe(
			CODEGEN_FRAMEWORK_CONFIGS.nextjs.clientPrefix,
		);
		expect(FRAMEWORK_CLIENT_PREFIXES.nuxt).toBe(
			CODEGEN_FRAMEWORK_CONFIGS.nuxt.clientPrefix,
		);
	});
});

describe("createScaffoldContext", () => {
	it.each(
		Object.entries(EXPECTED_CLIENT_PREFIXES) as [Framework, string][],
	)("uses the %s strategy clientPrefix (%j)", (framework, prefix) => {
		expect(createScaffoldContext(optionsFor(framework)).clientPrefix).toBe(
			prefix,
		);
	});
});
