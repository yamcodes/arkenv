/**
 * Regex pattern matching sensitive environment variable names.
 *
 * Matches keywords commonly associated with secrets (e.g. secret, key, token,
 * password, pass, auth, jwt, cert, credential, db_url). Excludes public keys
 * via the `shouldRedact` helper.
 *
 * @see {@link shouldRedact}
 */
const SENSITIVE_PATTERN =
	/secret|(_|^)key(_|$)|token|(_|^)password(_|$)|(_|^)pass(_|$)|(_|^)auth(_|$)|jwt|cert|credential|database_url|db_url/i;

/**
 * Check if debug secrets mode is enabled.
 *
 * Debug secrets mode can be enabled programmatically via the `debugSecrets` config option,
 * or globally by setting the `ARKENV_DEBUG_SECRETS` environment variable to `"true"` or `"1"`.
 *
 * @param configSecrets Programmatic override option for debugging secrets
 * @returns A boolean indicating if debug secrets mode is active
 */
export function isDebugSecrets(configSecrets?: boolean): boolean {
	if (configSecrets !== undefined) return configSecrets;
	if (typeof process === "undefined") return false;
	const val = process.env.ARKENV_DEBUG_SECRETS;
	return val === "true" || val === "1";
}

/**
 * Determine if an environment variable path matches sensitive keyword patterns.
 *
 * By default, environment variables that contain sensitive keywords (e.g. 'secret', 'key',
 * 'token', 'password', 'auth', 'jwt', 'cert', 'credential', 'db_url') are flagged for redaction,
 * unless they are explicitly marked as public (e.g., matching 'public').
 *
 * Redaction prevents sensitive values from being logged or printed to the terminal
 * when environment validation fails.
 *
 * @param path The environment variable name/path under validation
 * @returns A boolean indicating if the path is sensitive and should be redacted
 */
export function shouldRedact(path: string): boolean {
	return SENSITIVE_PATTERN.test(path) && !/public/i.test(path);
}

/**
 * Safely format and serialize an environment value for error reporting.
 *
 * Serializes primitive values and objects while redacting sensitive values if debugSecrets is disabled.
 * Limits object and array serialization to the first 3 keys/elements to prevent excessively large log outputs.
 *
 * @param val The raw received environment variable value
 * @param path The variable name/path under validation
 * @param options Configuration options, including debugSecrets override
 * @returns The formatted string representation of the value
 */
export function safeStringify(
	val: unknown,
	path: string,
	options?: { debugSecrets?: boolean },
): string {
	const debug = isDebugSecrets(options?.debugSecrets);

	if (val === undefined) return "missing";
	if (val === null) return "null";

	if (!debug && shouldRedact(path)) {
		return "[REDACTED]";
	}

	if (typeof val === "string") return JSON.stringify(val);
	if (
		typeof val === "number" ||
		typeof val === "boolean" ||
		typeof val === "bigint"
	) {
		return String(val);
	}
	if (typeof val === "symbol") return val.toString();
	if (typeof val === "function") return "[Function]";

	if (val && typeof val === "object") {
		try {
			if (Array.isArray(val)) {
				const res = val.slice(0, 3).map((x) => safeStringify(x, path, options));
				if (val.length > 3) res.push(`...(+${val.length - 3} more)`);
				return `[${res.join(", ")}]`;
			}
			const keys = Object.keys(val);
			const res = keys
				.slice(0, 3)
				.map((k) => `${k}: ${safeStringify((val as any)[k], path, options)}`);
			if (keys.length > 3) res.push(`...(+${keys.length - 3} more)`);
			return `{ ${res.join(", ")} }`;
		} catch {
			return Object.prototype.toString.call(val);
		}
	}

	return String(val);
}
