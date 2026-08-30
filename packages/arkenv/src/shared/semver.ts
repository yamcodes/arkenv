/**
 * Represents a parsed SemVer 2.0 version.
 */
export type SemVer = {
	major: number;
	minor: number;
	patch: number;
	prerelease: (string | number)[];
	build?: string;
};

/**
 * Parses a semantic version string into its components according to SemVer 2.0.
 *
 * @param version The version string to parse (e.g., "1.2.3-beta.1+build").
 * @returns The parsed SemVer object or null if parsing fails.
 */
export function parseSemver(version: string): SemVer | null {
	const trimmed = version.trim().replace(/^v/, "");
	// Regex matching standard SemVer 2.0: MAJOR.MINOR.PATCH(-PRERELEASE)?(+BUILD)?
	const match = trimmed.match(
		/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/,
	);

	if (!match) {
		// Fallback for short versions like "1.2" or "1"
		const shortMatch = trimmed.match(
			/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/,
		);
		if (!shortMatch) return null;

		const major = Number.parseInt(shortMatch[1], 10);
		const minor =
			shortMatch[2] !== undefined ? Number.parseInt(shortMatch[2], 10) : 0;
		const patch =
			shortMatch[3] !== undefined ? Number.parseInt(shortMatch[3], 10) : 0;
		const prereleaseRaw = shortMatch[4];
		const build = shortMatch[5];

		if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) {
			return null;
		}

		const prerelease = prereleaseRaw
			? prereleaseRaw
					.split(".")
					.map((id) => (/^\d+$/.test(id) ? Number.parseInt(id, 10) : id))
			: [];

		return { major, minor, patch, prerelease, build };
	}

	const major = Number.parseInt(match[1], 10);
	const minor = Number.parseInt(match[2], 10);
	const patch = Number.parseInt(match[3], 10);
	const prereleaseRaw = match[4];
	const build = match[5];

	if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) {
		return null;
	}

	const prerelease = prereleaseRaw
		? prereleaseRaw
				.split(".")
				.map((id) => (/^\d+$/.test(id) ? Number.parseInt(id, 10) : id))
		: [];

	return { major, minor, patch, prerelease, build };
}

/**
 * Compares two semantic version strings according to SemVer 2.0 precedence rules.
 *
 * Precedence is determined by comparing major, minor, patch, and pre-release identifiers:
 * - 1.0.0-beta.2 < 1.0.0-beta.11 (numeric comparison for numeric identifiers)
 * - 1.0.0-alpha < 1.0.0-beta (lexical comparison for string identifiers)
 * - 1.0.0-alpha < 1.0.0 (normal version has higher precedence than pre-release)
 * - Build metadata is ignored.
 *
 * @param v1 First version string.
 * @param v2 Second version string.
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal or either is unparseable.
 */
export function compareSemver(v1: string, v2: string): number {
	const s1 = parseSemver(v1);
	const s2 = parseSemver(v2);

	if (!s1 || !s2) return 0;

	// Compare major, minor, patch
	if (s1.major !== s2.major) return s1.major > s2.major ? 1 : -1;
	if (s1.minor !== s2.minor) return s1.minor > s2.minor ? 1 : -1;
	if (s1.patch !== s2.patch) return s1.patch > s2.patch ? 1 : -1;

	// When major, minor, patch are equal:
	// A normal version has greater precedence than a pre-release version.
	const hasPre1 = s1.prerelease.length > 0;
	const hasPre2 = s2.prerelease.length > 0;

	if (!hasPre1 && hasPre2) return 1; // 1.0.0 > 1.0.0-alpha
	if (hasPre1 && !hasPre2) return -1; // 1.0.0-alpha < 1.0.0
	if (!hasPre1 && !hasPre2) return 0; // 1.0.0 == 1.0.0

	// Both have pre-release identifiers; compare each identifier segment
	const minLen = Math.min(s1.prerelease.length, s2.prerelease.length);
	for (let i = 0; i < minLen; i++) {
		const id1 = s1.prerelease[i];
		const id2 = s2.prerelease[i];

		if (id1 === id2) continue;

		const isNum1 = typeof id1 === "number";
		const isNum2 = typeof id2 === "number";

		// Numeric identifiers always have lower precedence than non-numeric identifiers
		if (isNum1 && !isNum2) return -1;
		if (!isNum1 && isNum2) return 1;

		if (isNum1 && isNum2) {
			return id1 > id2 ? 1 : -1;
		}

		// Both are strings; compare lexically in ASCII sort order
		return (id1 as string).localeCompare(id2 as string);
	}

	// A larger set of pre-release fields has a higher precedence than a smaller set
	if (s1.prerelease.length !== s2.prerelease.length) {
		return s1.prerelease.length > s2.prerelease.length ? 1 : -1;
	}

	return 0;
}
