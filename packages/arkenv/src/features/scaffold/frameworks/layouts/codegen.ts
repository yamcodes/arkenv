import type { CodegenFrameworkConfig } from "@/features/scaffold/frameworks/codegen-config";
import { getPresetKeys, type HostPreset } from "@/features/scaffold/presets";
import type { Dialect } from "@/features/scaffold/validators/dialects";

/**
 * Options for assembling a Next.js / Nuxt single-file (flat or nested) template.
 */
export type CodegenLayoutOptions = {
	envKeys?: string[] | undefined;
	dialect: Dialect;
	config: CodegenFrameworkConfig;
	/** Generated env import path when codegen is enabled (Next.js). */
	importPath?: string | undefined;
	disableCodegen?: boolean | undefined;
	/**
	 * Layout selection. `"simple"` is a quarantined nested (server/client/shared)
	 * path kept for test parity; primary codegen path is flat when unset/flat.
	 */
	layout?: "strict" | "simple" | "flat" | undefined;
	/** Hosting provider preset - appended to defaults when `envKeys` is empty. */
	hostPreset?: HostPreset | undefined;
};

/**
 * Append hosting-preset field lines onto codegen field buckets.
 *
 * @param buckets Mutable server/client/shared field lines
 * @param dialect Validator dialect
 * @param clientPrefix Framework client prefix
 * @param hostPreset Selected hosting preset
 */
function appendPresetCodegenFields(
	buckets: {
		serverFields: string[];
		clientFields: string[];
	},
	dialect: Dialect,
	clientPrefix: string,
	hostPreset: HostPreset | undefined,
): void {
	const presetKeys = getPresetKeys(hostPreset ?? "none", clientPrefix);
	for (const key of presetKeys) {
		if (clientPrefix && key.startsWith(clientPrefix)) {
			buckets.clientFields.push(
				`\t\t${dialect.formatCodegenField(key, "client", clientPrefix, hostPreset)}`,
			);
		} else {
			buckets.serverFields.push(
				`\t\t${dialect.formatCodegenField(key, "server", clientPrefix, hostPreset)}`,
			);
		}
	}
}

/**
 * Extract env key names from dialect field lines (`KEY: ...`).
 *
 * @param fields Schema field source lines
 * @returns Key names in declaration order
 */
function extractFieldKeyNames(fields: string[]): string[] {
	const keys: string[] = [];
	for (const field of fields) {
		const match = field.trim().match(/^([a-zA-Z0-9_]+)\s*:/);
		if (match) {
			keys.push(match[1]);
		}
	}
	return keys;
}

/**
 * Build `runtimeEnv` field lines for `--no-codegen` Next.js / Nuxt templates.
 *
 * When explicit `envKeys` are absent, includes default client/`NODE_ENV` entries
 * plus any client-prefixed keys present in {@link clientFields} (e.g. hosting
 * preset keys appended after defaults).
 *
 * @param envKeys Explicit env keys when provided
 * @param clientPrefix Framework client prefix
 * @param clientFields Populated client schema field lines
 * @param extraKeys Additional keys to include (e.g. flat-layout exposed shared keys)
 * @returns Indented `key: process.env.key,` lines
 */
function buildNoCodegenRuntimeEnvFields(
	envKeys: string[] | undefined,
	clientPrefix: string,
	clientFields: string[],
	extraKeys: string[] = [],
): string[] {
	const runtimeEnvFields: string[] = [];
	const seen = new Set<string>();

	const push = (key: string) => {
		if (seen.has(key)) return;
		seen.add(key);
		runtimeEnvFields.push(`\t\t${key}: process.env.${key},`);
	};

	if (envKeys && envKeys.length > 0) {
		for (const key of envKeys) {
			if (
				key.startsWith(clientPrefix) ||
				key === "NODE_ENV" ||
				extraKeys.includes(key)
			) {
				push(key);
			}
		}
		return runtimeEnvFields;
	}

	push(`${clientPrefix}API_URL`);
	push("NODE_ENV");
	for (const key of extractFieldKeyNames(clientFields)) {
		push(key);
	}
	for (const key of extraKeys) {
		push(key);
	}
	return runtimeEnvFields;
}

/**
 * Assemble a Next.js / Nuxt env schema template (flat or nested).
 *
 * Owns structural assembly - key categorisation, imports, JSDoc, flat vs nested
 * (`layout === "simple"`), and runtimeEnv injection. The dialect supplies only
 * field lines and extra imports.
 *
 * @param options Layout and dialect inputs
 * @returns Generated TypeScript source
 */
export function assembleCodegenTemplate(options: CodegenLayoutOptions): string {
	const {
		envKeys,
		dialect,
		config,
		importPath: nextjsImportPath,
		disableCodegen,
		layout,
		hostPreset,
	} = options;

	const { clientPrefix } = config;

	const serverFields: string[] = [];
	const clientFields: string[] = [];
	const sharedFields: string[] = [];

	if (envKeys && envKeys.length > 0) {
		for (const key of envKeys) {
			if (key.startsWith(clientPrefix)) {
				clientFields.push(
					`\t\t${dialect.formatCodegenField(key, "client", clientPrefix, hostPreset)}`,
				);
			} else if (key === "NODE_ENV") {
				sharedFields.push(
					`\t\t${dialect.formatCodegenField(key, "shared", clientPrefix, hostPreset)}`,
				);
			} else {
				serverFields.push(
					`\t\t${dialect.formatCodegenField(key, "server", clientPrefix, hostPreset)}`,
				);
			}
		}
	} else {
		const defaults = dialect.getDefaultCodegenFields(clientPrefix);
		serverFields.push(...defaults.serverFields);
		clientFields.push(...defaults.clientFields);
		sharedFields.push(...defaults.sharedFields);
		appendPresetCodegenFields(
			{ serverFields, clientFields },
			dialect,
			clientPrefix,
			hostPreset,
		);
	}

	const useFlatLayout = layout !== "simple" && layout !== "strict";

	if (useFlatLayout) {
		return assembleFlatLayout({
			serverFields,
			clientFields,
			sharedFields,
			envKeys,
			dialect,
			config,
			nextjsImportPath,
			disableCodegen,
		});
	}

	return assembleNestedLayout({
		serverFields,
		clientFields,
		sharedFields,
		envKeys,
		dialect,
		config,
		nextjsImportPath,
		disableCodegen,
		layout,
	});
}

type FieldBuckets = {
	serverFields: string[];
	clientFields: string[];
	sharedFields: string[];
	envKeys?: string[] | undefined;
	dialect: Dialect;
	config: CodegenFrameworkConfig;
	nextjsImportPath?: string | undefined;
	disableCodegen?: boolean | undefined;
	layout?: "strict" | "simple" | "flat" | undefined;
};

function assembleFlatLayout(params: FieldBuckets): string {
	const {
		serverFields,
		clientFields,
		sharedFields,
		envKeys,
		dialect,
		config,
		nextjsImportPath,
		disableCodegen,
	} = params;
	const {
		clientPrefix,
		packageName: pkgName,
		displayName: frameworkName,
	} = config;
	const framework = config.id;
	const extraImports = dialect.extraImport;

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

	if (disableCodegen && framework === "nextjs") {
		const runtimeEnvFields = buildNoCodegenRuntimeEnvFields(
			envKeys,
			clientPrefix,
			clientFields,
			exposedKeyNames,
		);
		optionParts.push(`\truntimeEnv: {\n${runtimeEnvFields.join("\n")}\n\t}`);
	}

	const optionsStr =
		optionParts.length > 0 ? `, {\n${optionParts.join(",\n")}\n}` : "";

	const flatImportPath =
		framework === "nuxt"
			? pkgName
			: disableCodegen
				? pkgName
				: nextjsImportPath || "./generated/env.gen";

	const imports = [
		`import arkenv from "${flatImportPath}";`,
		...(extraImports ? [extraImports] : []),
	].join("\n");

	const flatDocsHint =
		framework === "nuxt"
			? `In ${frameworkName}, use \`${pkgName}\` to validate variables at build-time and runtime.`
			: `In ${frameworkName}, use the generated \`arkenv\` from \`env.gen.ts\` to validate variables.`;

	return `${imports}

/**
 * Environment variable schema.
 * ${flatDocsHint}
 * Enforces client/server separation and prevents secret leaks.
 */
export const env = arkenv({
${flatFields.join("\n")}
}${optionsStr});
`;
}

function assembleNestedLayout(params: FieldBuckets): string {
	const {
		serverFields,
		clientFields,
		sharedFields,
		envKeys,
		dialect,
		config,
		nextjsImportPath,
		disableCodegen,
		layout,
	} = params;
	const {
		clientPrefix,
		packageName: pkgName,
		displayName: frameworkName,
	} = config;
	const framework = config.id;
	const extraImports = dialect.extraImport;

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

	if (disableCodegen || (framework === "nuxt" && layout === "simple")) {
		const runtimeEnvFields = buildNoCodegenRuntimeEnvFields(
			envKeys,
			clientPrefix,
			clientFields,
		);
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
