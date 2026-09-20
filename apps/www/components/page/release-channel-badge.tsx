import Link from "next/link";

const MIGRATING_TO_V1 = "/docs/guides/migrating-to-v1";

/**
 * Compact header channel badge. Only renders during RC so the live chrome
 * does not pretend packages are GA. Links to the v1 migration guide.
 *
 * `releaseTag` must be resolved on the server (see `RELEASE_TAG` in
 * `~/lib/config/release`) and passed in — `SiteNav` is a client component, so
 * reading `ARKENV_RELEASE_TAG` here would miss the server-only env and fall
 * back to `"rc"` after GA.
 */
export function ReleaseChannelBadge({ releaseTag }: { releaseTag: string }) {
	if (releaseTag !== "rc") {
		return null;
	}

	return (
		<Link
			href={MIGRATING_TO_V1}
			className="site-nav__rc"
			title="Release Candidate — migrate to v1"
			aria-label="Release Candidate — migrate to v1"
		>
			RC
		</Link>
	);
}
