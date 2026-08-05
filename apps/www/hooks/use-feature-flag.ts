"use client";

import posthog from "posthog-js";
import { useEffect, useState } from "react";
import type { FeatureFlag } from "~/lib/posthog/feature-flags";

/**
 * Subscribe to a PostHog boolean feature flag.
 * Returns true only when the flag is explicitly enabled.
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		const sync = () => {
			setEnabled(posthog.isFeatureEnabled(flag) === true);
		};

		sync();
		return posthog.onFeatureFlags(sync);
	}, [flag]);

	return enabled;
}
