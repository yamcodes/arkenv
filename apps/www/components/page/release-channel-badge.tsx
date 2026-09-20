import Link from "next/link";
import { RELEASE_TAG } from "~/lib/config/release";

const MIGRATING_TO_V1 = "/docs/guides/migrating-to-v1";

/**
 * Compact header channel badge. Only renders during RC so the live chrome
 * does not pretend packages are GA. Links to the v1 migration guide.
 */
export function ReleaseChannelBadge() {
	if (RELEASE_TAG !== "rc") {
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
