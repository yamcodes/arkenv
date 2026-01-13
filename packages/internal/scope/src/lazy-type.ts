import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * Internal loader state using Symbol.for for cross-module coordination.
 */
const LOADER_SYMBOL = Symbol.for("__ARKENV_ARKTYPE_LOADER__");
const G = globalThis as any;

const MISSING_ERROR =
	"ArkType is required when using ArkType-specific schemas (string definitions or type() calls). " +
	"Please install 'arktype' as a dependency, or use Standard Schema validators like Zod instead.";

if (!G[LOADER_SYMBOL]) {
	G[LOADER_SYMBOL] = {
		at: undefined,
		forceMissing: false,
		load: (): typeof import("arktype") => {
			if (
				G[LOADER_SYMBOL].forceMissing ||
				process.env.ARKENV_FORCE_MISSING === "true"
			) {
				throw new Error(MISSING_ERROR);
			}
			if (G[LOADER_SYMBOL].at) return G[LOADER_SYMBOL].at;
			try {
				G[LOADER_SYMBOL].at = require("arktype");
				return G[LOADER_SYMBOL].at!;
			} catch (e: unknown) {
				if (
					e instanceof Error &&
					"code" in e &&
					e.code === "MODULE_NOT_FOUND" &&
					e.message.includes("'arktype'")
				) {
					throw new Error(MISSING_ERROR);
				}
				throw e;
			}
		},
		reset: () => {
			G[LOADER_SYMBOL].at = undefined;
			G[LOADER_SYMBOL].forceMissing = false;
			delete process.env.ARKENV_FORCE_MISSING;
		},
	};
}

export const arktypeLoader = G[LOADER_SYMBOL];

/**
 * A lazy proxy that defers loading ArkType until it is actually needed.
 */

type LazyTypeProxy = {
	def: unknown;
	morphs: Array<(value: unknown) => unknown>;
	_realized?: any;
};

/**
 * Create a lazy proxy for an ArkType definition.
 */
function createLazyProxy(state: LazyTypeProxy): any {
	return new Proxy(() => {}, {
		get(_, prop) {
			if (prop === "isArktype") return true;
			if (prop === "pipe") {
				return (morph: (value: unknown) => unknown) => {
					state.morphs.push(morph);
					return createLazyProxy(state);
				};
			}
			return realizeType(state)[prop];
		},
		apply(_, __, args) {
			const realized = realizeType(state);
			return realized(...args);
		},
	});
}

/**
 * Realize the actual ArkType type from the lazy proxy state.
 */
function realizeType(state: LazyTypeProxy): any {
	if (state._realized) {
		return state._realized;
	}

	const at = arktypeLoader.load();
	const { type } = at;

	let realized = type(state.def as any);

	for (const morph of state.morphs) {
		realized = realized.pipe(morph);
	}

	state._realized = realized;
	return realized;
}

/**
 * The lazy type function that mimics ArkType's `type()` API.
 */
import type { type as ArkType } from "arktype";
export const lazyType = new Proxy(() => {}, {
	apply(_, __, [def]) {
		return createLazyProxy({ def, morphs: [] });
	},
	get(_, prop) {
		if (prop === "isArktype") return true;
		const at = arktypeLoader.load();
		return (at.type as any)[prop];
	},
}) as typeof ArkType;
