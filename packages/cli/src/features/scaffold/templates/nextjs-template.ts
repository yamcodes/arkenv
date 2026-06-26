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
	 * @param key The env var name (e.g. `NODE_ENV`)
	 * @returns A formatted schema field string
	 */
	sharedField(key: string): string;
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
 * @param envKeys Optional array of env keys scanned from the project
 * @param builders Validator-specific field formatters and default field values
 * @param nextjsImportPath The optional custom import path for the generated file
 * @returns The generated TypeScript source string
 */
export function buildNextjsTemplate(
	envKeys: string[] | undefined,
	builders: NextjsFieldBuilders,
	nextjsImportPath?: string,
	disableCodegen?: boolean,
	framework?: string,
	layout?: "strict" | "simple" | "flat",
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

	const clientPrefix = framework === "nuxt" ? "NUXT_PUBLIC_" : "NEXT_PUBLIC_";
	const pkgName = framework === "nuxt" ? "@arkenv/nuxt" : "@arkenv/nextjs";
	const frameworkName = framework === "nuxt" ? "Nuxt" : "Next.js";

	const serverFields: string[] = [];
	const clientFields: string[] = [];
	const sharedFields: string[] = [];

	if (envKeys && envKeys.length > 0) {
		for (const key of envKeys) {
			if (key.startsWith(clientPrefix)) {
				clientFields.push(clientField(key));
			} else if (key === "NODE_ENV") {
				sharedFields.push(sharedField(key));
			} else {
				serverFields.push(serverField(key));
			}
		}
	} else {
		serverFields.push(...defaultServerFields);
		clientFields.push(...defaultClientFields);
		sharedFields.push(...defaultSharedFields);
	}

	if (framework === "nextjs" && layout !== "simple") {
		const allFields = [...serverFields, ...clientFields, ...sharedFields];
		const flatFields = allFields.map((field) => field.replace(/^\t\t/, "\t"));

		const exposedKeyNames: string[] = [];
		for (const field of sharedFields) {
			const match = field.trim().match(/^([a-zA-Z0-9_]+)\s*:/);
			if (match) {
				const key = match[1];
				if (key !== "NODE_ENV") {
					exposedKeyNames.push(key);
				}
			}
		}

		const optionParts: string[] = [];
		if (exposedKeyNames.length > 0) {
			optionParts.push(
				`\texposeToClient: [${exposedKeyNames.map((k) => `"${k}"`).join(", ")}]`,
			);
		}

		if (disableCodegen) {
			const runtimeEnvFields: string[] = [];
			if (envKeys && envKeys.length > 0) {
				for (const key of envKeys) {
					if (key.startsWith(clientPrefix) || key === "NODE_ENV") {
						runtimeEnvFields.push(`\t\t${key}: process.env.${key},`);
					}
				}
			} else {
				runtimeEnvFields.push(
					"\t\tNEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,",
					"\t\tNODE_ENV: process.env.NODE_ENV,",
				);
			}
			optionParts.push(`\truntimeEnv: {\n${runtimeEnvFields.join("\n")}\n\t}`);
		}

		const optionsStr =
			optionParts.length > 0 ? `, {\n${optionParts.join(",\n")}\n}` : "";

		const imports = [
			`import arkenv from "${disableCodegen ? "@arkenv/nextjs" : nextjsImportPath || "./generated/env.gen"}";`,
			...(extraImports ? [extraImports] : []),
		].join("\n");

		return `${imports}

/**
 * Environment variable schema.
 * In ${frameworkName}, use the generated \`arkenv\` from \`env.gen.ts\` to validate variables.
 * Enforces client/server separation and prevents secret leaks.
 */
export const env = arkenv({
${flatFields.join("\n")}
}${optionsStr});
`;
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

	if (disableCodegen || framework === "nuxt") {
		const runtimeEnvFields: string[] = [];
		if (envKeys && envKeys.length > 0) {
			for (const key of envKeys) {
				if (key.startsWith(clientPrefix) || key === "NODE_ENV") {
					runtimeEnvFields.push(`\t\t${key}: process.env.${key},`);
				}
			}
		} else {
			runtimeEnvFields.push(
				`\t\t${clientPrefix}API_URL: process.env.${clientPrefix}API_URL,`,
				"\t\tNODE_ENV: process.env.NODE_ENV,",
			);
		}
		if (framework !== "nuxt") {
			sections.push(`\truntimeEnv: {\n${runtimeEnvFields.join("\n")}\n\t}`);
		}

		const imports = [
			`import arkenv from "${pkgName}";`,
			...(extraImports ? [extraImports] : []),
		].join("\n");

		return `${imports}

/**
 * Environment variable schema.
 * In ${frameworkName}, use \`${pkgName}\` to validate variables at build-time and runtime.
 * Enforces client/server separation and prevents secret leaks.
 */
export const env = arkenv({
${sections.join(",\n")},
});
`;
	}

	const imports = [
		`import arkenv from "${nextjsImportPath || "./generated/env.gen"}";`,
		...(extraImports ? [extraImports] : []),
	].join("\n");

	return `${imports}

/**
 * Environment variable schema.
 * In ${frameworkName}, use the generated \`arkenv\` from \`env.gen.ts\` to validate variables.
 * Enforces client/server separation and prevents secret leaks.
 */
export const env = arkenv({
${sections.join(",\n")},
});
`;
}
