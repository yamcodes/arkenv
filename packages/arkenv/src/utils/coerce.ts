import { maybeParsedBoolean, maybeParsedNumber } from "@repo/keywords";
import type { BaseType } from "arktype";
import { type } from "../type";

/**
 * @internal
 * Information about a path in the schema that requires coercion.
 */
interface CoercionTarget {
	path: string[];
}

/**
 * Identify if a JSON schema node represents a numeric type.
 */
const isNumeric = (node: unknown): boolean => {
	if (node === "number") return true;
	if (typeof node === "object" && node !== null && !Array.isArray(node)) {
		const n = node as Record<string, any>;
		const domain = typeof n.domain === "object" ? n.domain?.domain : n.domain;
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
		const n = node as Record<string, any>;
		const domain = typeof n.domain === "object" ? n.domain?.domain : n.domain;
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
		const n = node as any;

		// Handle explicit branches property if it exists (though in.json often uses raw arrays for unions)
		if (n.branches && Array.isArray(n.branches)) {
			for (const branch of n.branches) {
				results.push(...findCoercionPaths(branch, path));
			}
		}

		// Handle properties
		if (n.required && Array.isArray(n.required)) {
			for (const p of n.required) {
				results.push(...findCoercionPaths(p.value, [...path, p.key]));
			}
		}
		if (n.optional && Array.isArray(n.optional)) {
			for (const p of n.optional) {
				results.push(...findCoercionPaths(p.value, [...path, p.key]));
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
function applyCoercion(data: any, targets: CoercionTarget[]): any {
	if (!data || typeof data !== "object" || Array.isArray(data)) {
		if (targets.some((t) => t.path.length === 0)) {
			return maybeParsedNumber(maybeParsedBoolean(data));
		}
		return data;
	}

	const result = { ...data };

	for (const { path } of targets) {
		if (path.length === 0) continue;

		let curr = result;
		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i];
			if (curr[key] && typeof curr[key] === "object") {
				// Only clone if it's the original object from data (not already cloned in result)
				// Since we shallow cloned 'data' into 'result', curr[key] is still pointing to the original nested object.
				curr[key] = { ...curr[key] };
				curr = curr[key];
			} else {
				// Path doesn't exist or is not an object, can't descend
				break;
			}
		}

		const lastKey = path[path.length - 1];
		if (Object.hasOwn(curr, lastKey)) {
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
