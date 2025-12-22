import { maybeParsedBoolean, maybeParsedNumber } from "@repo/keywords";
import type { BaseType } from "arktype";
import { type } from "../type";

/**
 * @internal
 * Information about a path in the schema that requires coercion.
 */
type CoercionTarget = {
	path: string[];
};

/**
 * Identify if a JSON schema node represents a numeric type.
 *
 * Pattern mapping to ArkType constructs:
 * - `node === "number"` → simple "number" type
 * - `domain === "number"` → constrained numbers like "number >= 18" or "number % 2"
 * - `typeof n.unit === "number"` → numeric literals like 1, 2, or "1 | 2"
 * - `n.kind === "intersection" && domain === "number"` → intersection constraints
 */
const isNumeric = (node: unknown): boolean => {
	if (node === "number") return true;
	if (typeof node === "object" && node !== null && !Array.isArray(node)) {
		const n = node as Record<string, unknown>;
		const domain =
			typeof n.domain === "object" && n.domain !== null
				? (n.domain as Record<string, unknown>).domain
				: n.domain;
		return (
			domain === "number" ||
			typeof n.unit === "number" ||
			(n.kind === "intersection" && domain === "number")
		);
	}
	return false;
};

/**
 * Identify if a JSON schema node represents a boolean type.
 */
const isBoolean = (node: unknown): boolean => {
	if (node === "boolean") return true;
	if (typeof node === "object" && node !== null && !Array.isArray(node)) {
		const n = node as Record<string, unknown>;
		const domain =
			typeof n.domain === "object" && n.domain !== null
				? (n.domain as Record<string, unknown>).domain
				: n.domain;
		if (domain === "boolean" || n.expression === "boolean") return true;
		if (typeof n.unit === "boolean") return true;
	}
	// Note: Union booleans like true | false are handled by recursing into the union array.
	return false;
};

/**
 * Recursively find all paths in an ArkType JSON representation that require coercion.
 */
const findCoercionPaths = (
	node: unknown,
	path: string[] = [],
): CoercionTarget[] => {
	const results: CoercionTarget[] = [];

	if (isNumeric(node) || isBoolean(node)) {
		results.push({ path: [...path] });
	}

	if (Array.isArray(node)) {
		// This is a union (branches)
		for (const branch of node) {
			results.push(...findCoercionPaths(branch, path));
		}
	} else if (typeof node === "object" && node !== null) {
		const n = node as Record<string, unknown>;

		// Handle explicit branches property if it exists (though in.json often uses raw arrays for unions)
		if (Array.isArray(n.branches)) {
			for (const branch of n.branches) {
				results.push(...findCoercionPaths(branch, path));
			}
		}

		// Handle properties
		if (Array.isArray(n.required)) {
			for (const p of n.required) {
				const prop = p as Record<string, unknown>;
				results.push(
					...findCoercionPaths(prop.value, [...path, prop.key as string]),
				);
			}
		}
		if (Array.isArray(n.optional)) {
			for (const p of n.optional) {
				const prop = p as Record<string, unknown>;
				results.push(
					...findCoercionPaths(prop.value, [...path, prop.key as string]),
				);
			}
		}

		// Handle sequences (arrays)
		if (n.sequence) {
			// Coerce the elements of the array. In arkenv's typical use case (env vars),
			// this would be for things like COMMA_SEPARATED_LIST=1,2,3
			results.push(...findCoercionPaths(n.sequence, path));
		}
	}

	return results;
};

/**
 * Apply coercion to a data object based on identified paths.
 */
function applyCoercion(data: unknown, targets: CoercionTarget[]): unknown {
	if (!data || typeof data !== "object" || Array.isArray(data)) {
		if (targets.some((t) => t.path.length === 0)) {
			return maybeParsedNumber(maybeParsedBoolean(data));
		}
		return data;
	}

	const result = { ...(data as Record<string, unknown>) };
	// Track objects that have been cloned/created by us to avoid re-cloning.
	const processedObjects = new Set<unknown>([result]);

	for (const { path } of targets) {
		if (path.length === 0) continue;

		let curr = result;
		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i];
			if (
				// biome-ignore lint/suspicious/noPrototypeBuiltins: Safe usage
				Object.prototype.hasOwnProperty.call(curr, key) &&
				curr[key] &&
				typeof curr[key] === "object"
			) {
				const next = curr[key] as Record<string, unknown>;

				if (!processedObjects.has(next)) {
					// We haven't cloned this object yet, so clone it to ensure immutability of original data
					const cloned = { ...next };
					curr[key] = cloned;
					processedObjects.add(cloned);
					curr = cloned;
				} else {
					// We already cloned this object in a previous iteration/path, so we can use it directly
					curr = next;
				}
			} else {
				// Path doesn't exist or is not an object, can't descend
				break;
			}
		}

		const lastKey = path[path.length - 1];
		// biome-ignore lint/suspicious/noPrototypeBuiltins: Safe usage
		if (Object.prototype.hasOwnProperty.call(curr, lastKey)) {
			curr[lastKey] = maybeParsedNumber(maybeParsedBoolean(curr[lastKey]));
		}
	}

	return result;
}

/**
 * Traverses an ArkType schema and wraps numeric or boolean values in coercion morphs.
 */
export function coerce<t, $ = {}>(schema: BaseType<t, $>): BaseType<t, $> {
	const targets = findCoercionPaths(schema.in.json);

	if (targets.length === 0) {
		return schema;
	}

	return type("unknown")
		.pipe((data) => applyCoercion(data, targets))
		.pipe(schema) as never;
}
