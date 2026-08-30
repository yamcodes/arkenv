import { compareSemver, parseSemver } from "@/shared/semver";

/**
 * Options for performing a version freshness check.
 */
export type FreshnessCheckOptions = {
	/** Current running package version. */
	currentVersion: string;
	/** Target package name to check on npm (defaults to "arkenv"). */
	packageName?: string;
	/** Abort timeout in milliseconds (defaults to 1000ms). */
	timeoutMs?: number;
	/** Dist tag to check (defaults to the pre-release tag e.g. "alpha" or "latest"). */
	distTag?: string;
};

/**
 * Result of a version freshness check.
 */
export type FreshnessCheckResult = {
	/** True if the latest published version on npm is strictly greater than the current version. */
	isOutdated: boolean;
	/** Latest version available on npm if successfully fetched and evaluated. */
	latestVersion?: string;
	/** Tag that was queried. */
	distTag?: string;
};

/**
 * Client for checking whether the running CLI is outdated compared to the npm registry.
 */
export class VersionCheckerClient {
	/**
	 * Checks if a newer version of the package exists on the npm registry.
	 * Fails open silently returning `{ isOutdated: false }` upon any error or timeout.
	 *
	 * @param options Freshness check options.
	 * @returns A promise resolving to the freshness check result.
	 */
	async checkFreshness(
		options: FreshnessCheckOptions,
	): Promise<FreshnessCheckResult> {
		const {
			currentVersion,
			packageName = "arkenv",
			timeoutMs = 1000,
		} = options;

		try {
			const parsed = parseSemver(currentVersion);
			const defaultTag =
				typeof parsed?.prerelease[0] === "string"
					? parsed.prerelease[0]
					: "latest";
			const distTag = options.distTag || defaultTag;
			const encodedName = encodeURIComponent(packageName);
			const url = `https://registry.npmjs.org/${encodedName}/${encodeURIComponent(distTag)}`;

			const response = await fetch(url, {
				signal: AbortSignal.timeout(timeoutMs),
				headers: {
					Accept: "application/json",
				},
			});

			if (!response.ok) {
				return { isOutdated: false };
			}

			const data = (await response.json()) as { version?: string };
			const latestVersion = data?.version;

			if (!latestVersion || typeof latestVersion !== "string") {
				return { isOutdated: false };
			}

			const isOutdated = compareSemver(latestVersion, currentVersion) > 0;
			return {
				isOutdated,
				latestVersion,
				distTag,
			};
		} catch {
			// Fail open on timeouts, offline environments, DNS errors, etc.
			return { isOutdated: false };
		}
	}
}
