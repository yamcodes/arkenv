import { FeatureFlags } from "~/lib/feature-flags";

const DISCORD_INVITE_URL = "https://discord.gg/zAmUyuxXH9";

/**
 * Discord list item gated by {@link FeatureFlags.DISCORD_LINK}.
 * Single callsite for the flag — returns null when disabled.
 */
export function DiscordListItem({ className }: { className?: string }) {
	if (!FeatureFlags.DISCORD_LINK) return null;

	return (
		<li>
			<a
				href={DISCORD_INVITE_URL}
				target="_blank"
				rel="noopener noreferrer"
				className={className}
			>
				Discord
			</a>
		</li>
	);
}
