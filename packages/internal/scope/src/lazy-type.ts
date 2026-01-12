import { createRequire } from "node:module";
import type { type as ArkType } from "arktype";

const require = createRequire(import.meta.url);

/**
 * A lazy proxy that defers loading ArkType until it is actually needed.
 * This allows internal packages to use ArkType syntax without creating
 * static import dependencies that would break when ArkType is not installed.
 */

type LazyTypeProxy = {
	def: unknown;
	morphs: Array<(value: unknown) => unknown>;
	_realized?: any;
};

/**
 * Create a lazy proxy for an ArkType definition.
 * The proxy intercepts property access and method calls, only loading
 * ArkType when the validator is actually used or inspected.
 */
function createLazyProxy(state: LazyTypeProxy): any {
	return new Proxy(
		{},
		{
			get(_, prop) {
				// Handle .pipe() - chain morphs without realizing the type yet
				if (prop === "pipe") {
					return (morph: (value: unknown) => unknown) => {
						state.morphs.push(morph);
						return createLazyProxy(state);
					};
				}

				// For any other property access, we need to realize the type
				return realizeType(state)[prop];
			},
			apply(_, __, args) {
				// If the proxy itself is called as a validator
				const realized = realizeType(state);
				return realized(...args);
			},
		},
	);
}

/**
 * Realize the actual ArkType type from the lazy proxy state.
 * This is where we actually require("arktype") and build the type.
 */
function realizeType(state: LazyTypeProxy): any {
	if (state._realized) {
		return state._realized;
	}

	let at: typeof import("arktype");
	try {
		at = require("arktype");
	} catch (e: unknown) {
		if (
			e instanceof Error &&
			"code" in e &&
			e.code === "MODULE_NOT_FOUND" &&
			e.message.includes("'arktype'")
		) {
			throw new Error(
				"ArkType is required when using ArkType-specific schemas (string definitions or type() calls). " +
					"Please install 'arktype' as a dependency, or use Standard Schema validators like Zod instead.",
			);
		}
		throw e;
	}

	const { type } = at;

	// Build the type from the definition
	let realized = type(state.def as any);

	// Apply any chained morphs
	for (const morph of state.morphs) {
		realized = realized.pipe(morph);
	}

	state._realized = realized;
	return realized;
}

/**
 * The lazy type function that mimics ArkType's `type()` API.
 * This is typed as ArkType's type function for full DX compatibility,
 * but returns a lazy proxy that defers loading ArkType until needed.
 */
export const lazyType = new Proxy(() => {}, {
	apply(_, __, [def]) {
		return createLazyProxy({ def, morphs: [] });
	},
	get(_, prop) {
		// Forward static properties from the real type function
		// This ensures things like type.keywords work correctly
		const at = require("arktype");
		return at.type[prop];
	},
}) as typeof ArkType;
