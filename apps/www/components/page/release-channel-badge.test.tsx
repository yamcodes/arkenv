import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("ReleaseChannelBadge", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.resetModules();
	});

	it("renders a compact RC link to the migration guide when RELEASE_TAG is rc", async () => {
		vi.stubEnv("NEXT_PUBLIC_ARKENV_RELEASE_TAG", "rc");
		vi.stubEnv("ARKENV_RELEASE_TAG", "rc");
		const { ReleaseChannelBadge } = await import("./release-channel-badge");
		render(<ReleaseChannelBadge />);
		const link = screen.getByRole("link", {
			name: /release candidate — migrate to v1/i,
		});
		expect(link).toHaveTextContent("RC");
		expect(link).toHaveAttribute("href", "/docs/guides/migrating-to-v1");
		expect(link).toHaveAttribute("title", "Release Candidate — migrate to v1");
	});

	it("renders nothing when RELEASE_TAG is not rc", async () => {
		vi.stubEnv("NEXT_PUBLIC_ARKENV_RELEASE_TAG", "alpha");
		vi.stubEnv("ARKENV_RELEASE_TAG", "alpha");
		const { ReleaseChannelBadge } = await import("./release-channel-badge");
		const { container } = render(<ReleaseChannelBadge />);
		expect(container).toBeEmptyDOMElement();
	});
});
