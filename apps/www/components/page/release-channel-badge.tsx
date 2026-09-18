import { AnnouncementBadge } from "~/components/announcement-badge";
import { RELEASE_TAG } from "~/lib/config/release";

/**
 * Hero announcement chip that names the active pre-release channel.
 * Only renders during RC so the live site does not pretend packages are GA.
 */
export function ReleaseChannelBadge() {
	if (RELEASE_TAG !== "rc") {
		return null;
	}

	return (
		<AnnouncementBadge href="/docs/guides/migrating-to-v1" new>
			Release Candidate
		</AnnouncementBadge>
	);
}
