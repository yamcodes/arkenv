const SENSITIVE_PATTERN =
	/secret|(_|^)key(_|$)|token|(_|^)password(_|$)|(_|^)pass(_|$)|(_|^)auth(_|$)|jwt|cert|credential|database_url|db_url/i;

export function shouldRedact(path: string): boolean {
	return SENSITIVE_PATTERN.test(path) && !/public/i.test(path);
}

export function safeStringify(
	val: unknown,
	path: string,
	options?: { debugSecrets?: boolean },
): string {
	const debugSecrets =
		options?.debugSecrets ??
		(typeof process !== "undefined" &&
			(process.env.ARKENV_DEBUG_SECRETS === "true" ||
				process.env.ARKENV_DEBUG_SECRETS === "1"));

	if (val === undefined) return "missing";
	if (val === null) return "null";

	if (!debugSecrets && shouldRedact(path)) {
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
