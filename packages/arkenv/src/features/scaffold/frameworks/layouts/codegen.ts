import type { CodegenFrameworkConfig } from "@/features/scaffold/frameworks/codegen-config";
import {
	getPresetKeys,
	type HostPreset,
	PRESETS,
} from "@/features/scaffold/presets";
import type { Dialect } from "@/features/scaffold/validators/dialects";

/**
 * Options for assembling a Next.js / Nuxt single-file flat template.
 */
export type CodegenLayoutOptions = {
	envKeys?: string[] | undefined;
	dialect: Dialect;
	config: CodegenFrameworkConfig;
	/**
	 * Generated env import path when codegen is enabled (Next.js).
	 */
	importPath?: string | undefined;
	disableCodegen?: boolean | undefined;
	/**
	 * Hosting provider preset - appended to defaults when `envKeys` is empty.
	 */
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
	if (!hostPreset || hostPreset === "none") return;
	const presetKeys = getPresetKeys(hostPreset, clientPrefix);
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
 * Assemble a Next.js / Nuxt flat env schema template.
 *
 * Owns structural assembly - key categorisation, imports, JSDoc, and
 * runtimeEnv injection. The dialect supplies only field lines and extra imports.
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

	return assembleFlatLayout({
		serverFields,
		clientFields,
		sharedFields,
		envKeys,
		dialect,
		config,
		nextjsImportPath,
		disableCodegen,
		hostPreset,
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
	hostPreset?: HostPreset | undefined;
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
		hostPreset,
	} = params;
	const {
		clientPrefix,
		packageName: pkgName,
		displayName: frameworkName,
	} = config;
	const framework = config.id;
	const extraImports = dialect.extraImport;
	const presetKeys = getPresetKeys(hostPreset ?? "none", clientPrefix);

	let flatFields: string[];
	if (hostPreset && hostPreset !== "none" && presetKeys.length > 0) {
		const rawFields = [...serverFields, ...clientFields, ...sharedFields];
		const userFields = rawFields
			.filter((f) => {
				const key = f.trim().match(/^([a-zA-Z0-9_]+)\s*:/)?.[1];
				return key && !presetKeys.includes(key);
			})
			.map((field) => field.replace(/^\t\t/, "\t"));

		const presetFieldLines: string[] = [];
		for (const key of presetKeys) {
			const role =
				clientPrefix && key.startsWith(clientPrefix)
					? "client"
					: key === "NODE_ENV"
						? "shared"
						: "server";
			presetFieldLines.push(
				`\t${dialect.formatCodegenField(key, role, clientPrefix, hostPreset)}`,
			);
		}

		const presetLabel = PRESETS[hostPreset]?.label ?? hostPreset;
		flatFields = [
			...userFields,
			...(userFields.length > 0 ? [""] : []),
			`\t// ${presetLabel} environment variables`,
			...presetFieldLines,
		];
	} else {
		const allFields = [...serverFields, ...clientFields, ...sharedFields];
		flatFields = allFields.map((field) => field.replace(/^\t\t/, "\t"));
	}

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
				: nextjsImportPath || "@/.arkenv";

	const imports = [
		`import arkenv from "${flatImportPath}";`,
		...(extraImports ? [extraImports] : []),
	].join("\n");

	const flatDocsHint =
		framework === "nuxt"
			? `In ${frameworkName}, use \`${pkgName}\` to validate variables at build-time and runtime.`
			: `In ${frameworkName}, import the generated \`arkenv\` from \`@/.arkenv\` to validate variables.`;

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
