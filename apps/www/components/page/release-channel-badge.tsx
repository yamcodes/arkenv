import { AnnouncementBadge } from "~/components/announcement-badge";
import { RELEASE_TAG } from "~/lib/config/release";

/**
 * Hero announcement chip linking to the RC blog post.
 * Only renders during RC so the live site does not pretend packages are GA.
 */
export function ReleaseChannelBadge() {
	if (RELEASE_TAG !== "rc") {
		return null;
	}

	return (
		<AnnouncementBadge href="/blog/arkenv-v1-rc">
			v1 RC is here
		</AnnouncementBadge>
	);
}
