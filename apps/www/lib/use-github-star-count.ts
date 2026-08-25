"use client";

import { useEffect, useState } from "react";
import { FeatureFlags } from "~/lib/feature-flags";

/**
 * Fetches the cached star count when {@link FeatureFlags.GITHUB_STAR_COUNT} is on.
 * Returns `null` when disabled or unavailable.
 */
export function useGithubStarCount(): number | null {
	const [starCount, setStarCount] = useState<number | null>(null);

	useEffect(() => {
		if (!FeatureFlags.GITHUB_STAR_COUNT) return;

		const fetchStarCount = async () => {
			try {
				const response = await fetch("/api/github/stars");
				if (response.ok) {
					const data = (await response.json()) as { stars: number };
					setStarCount(data.stars);
				}
			} catch {
				// Silently fail — omit the count
			}
		};

		void fetchStarCount();
	}, []);

	return starCount;
}
