import { renderHook, waitFor } from "@testing-library/react";
import posthog from "posthog-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFeatureFlag } from "./use-feature-flag";
import { FeatureFlag } from "~/lib/posthog/feature-flags";

vi.mock("posthog-js", () => ({
	default: {
		isFeatureEnabled: vi.fn(),
		onFeatureFlags: vi.fn(),
	},
}));

describe("useFeatureFlag", () => {
	beforeEach(() => {
		vi.mocked(posthog.isFeatureEnabled).mockReset();
		vi.mocked(posthog.onFeatureFlags).mockReset();
		vi.mocked(posthog.onFeatureFlags).mockReturnValue(() => undefined);
	});

	it("returns false until the flag is explicitly true", async () => {
		vi.mocked(posthog.isFeatureEnabled).mockReturnValue(undefined);
		const { result } = renderHook(() =>
			useFeatureFlag(FeatureFlag.THEME_TOGGLE),
		);
		expect(result.current).toBe(false);
	});

	it("returns true when PostHog reports the flag enabled", async () => {
		vi.mocked(posthog.isFeatureEnabled).mockReturnValue(true);
		const { result } = renderHook(() =>
			useFeatureFlag(FeatureFlag.THEME_TOGGLE),
		);
		await waitFor(() => {
			expect(result.current).toBe(true);
		});
	});

	it("returns false for non-true flag values", async () => {
		vi.mocked(posthog.isFeatureEnabled).mockReturnValue(false);
		const { result } = renderHook(() =>
			useFeatureFlag(FeatureFlag.THEME_TOGGLE),
		);
		await waitFor(() => {
			expect(result.current).toBe(false);
		});
	});
});
