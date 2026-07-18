"use client";

import { TypeTable } from "@arkenv/fumadocs-ui/components";

/**
 * Render the ArkEnv `string.*` keyword catalog for docs.
 */
export function StringKeywordsTable() {
	return (
		<TypeTable
			expandAll
			type={{
				"string.host": {
					type: "string.ip | 'localhost'",
					description:
						'An IP address (string.ip) or "localhost" — equivalent to the type shown above.',
				},
			}}
		/>
	);
}

/**
 * Render the ArkEnv `number.*` keyword catalog for docs.
 */
export function NumberKeywordsTable() {
	return (
		<TypeTable
			expandAll
			type={{
				"number.port": {
					type: "0 <= number.integer <= 65535",
					description:
						"An integer port in the range 0–65535 — equivalent to the type shown above.",
				},
			}}
		/>
	);
}
