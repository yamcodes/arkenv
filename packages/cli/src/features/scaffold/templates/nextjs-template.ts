/**
 * Validator-specific field builder callbacks for the Next.js template.
 * Callers supply only what differs between validators; all structural
 * assembly is handled by {@link buildNextjsTemplate}.
 */
export type NextjsFieldBuilders = {
	/** Extra import lines to inject after `import arkenv from "@arkenv/nextjs"` (e.g. `import { z } from "zod"`) */
	extraImports?: string;
	/**
	 * Format a schema field line for a server-only env var.
	 *
	 * @param key The env var name
	 * @returns A formatted schema field string
	 */
	serverField(key: string): string;
	/**
	 * Format a schema field line for a client-side (`NEXT_PUBLIC_`) env var.
	 *
	 * @param key The env var name
	 * @returns A formatted schema field string
	 */
	clientField(key: string): string;
	/**
	 * Format a schema field line for a shared env var.
	 *
	 * @param key The env var name (e.g. `NODE_ENV` or `PORT`)
	 * @param isPort `true` when the key is `PORT`; `false` for `NODE_ENV`
	 * @returns A formatted schema field string
	 */
	sharedField(key: string, isPort: boolean): string;
	/** Default `server` section lines used when no `envKeys` are provided. */
	defaultServerFields: string[];
	/** Default `client` section lines used when no `envKeys` are provided. */
	defaultClientFields: string[];
	/** Default `shared` section lines used when no `envKeys` are provided. */
	defaultSharedFields: string[];
};

/**
 * Generate a Next.js `env.ts` template string for any supported validator.
 *
 * Owns all structural assembly:
 * - Categorise env keys into `server`, `client`, `shared`, and `runtimeEnv`
 * - Produce the `import` header and JSDoc comment
 * - Join sections and emit the final `export const env = arkenv({…})`
 *
 * @param envKeys Optional array of env var keys scanned from the project
 * @param builders Validator-specific field formatters and default field values
 * @returns The generated TypeScript source string
 */
export function buildNextjsTemplate(
	envKeys: string[] | undefined,
	builders: NextjsFieldBuilders,
): string {
	const {
		extraImports,
		serverField,
		clientField,
		sharedField,
		defaultServerFields,
		defaultClientFields,
		defaultSharedFields,
	} = builders;

	const serverFields: string[] = [];
	const clientFields: string[] = [];
	const sharedFields: string[] = [];

	if (envKeys && envKeys.length > 0) {
		for (const key of envKeys) {
			if (key.startsWith("NEXT_PUBLIC_")) {
				clientFields.push(clientField(key));
			} else if (key === "NODE_ENV" || key === "PORT") {
				sharedFields.push(sharedField(key, key === "PORT"));
			} else {
				serverFields.push(serverField(key));
			}
		}
	} else {
		serverFields.push(...defaultServerFields);
		clientFields.push(...defaultClientFields);
		sharedFields.push(...defaultSharedFields);
	}

	const sections: string[] = [];
	if (serverFields.length > 0) {
		sections.push(`\tserver: {\n${serverFields.join("\n")}\n\t}`);
	}
	if (clientFields.length > 0) {
		sections.push(`\tclient: {\n${clientFields.join("\n")}\n\t}`);
	}
	if (sharedFields.length > 0) {
		sections.push(`\tshared: {\n${sharedFields.join("\n")}\n\t}`);
	}

	const imports = [
		`import { createEnv } from "./generated/env.gen";`,
		...(extraImports ? [extraImports] : []),
	].join("\n");

	return `${imports}

/**
 * Environment variable schema.
 * In Next.js, use the generated \`createEnv\` from \`env.gen.ts\` to validate variables.
 * Enforces client/server separation and prevents secret leaks.
 */
export const env = createEnv({
${sections.join(",\n")},
});
`;
}
