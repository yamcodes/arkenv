import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("ReleaseChannelBadge", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.resetModules();
	});

	it("renders the Release Candidate chip when RELEASE_TAG is rc", async () => {
		vi.stubEnv("NEXT_PUBLIC_ARKENV_RELEASE_TAG", "rc");
		vi.stubEnv("ARKENV_RELEASE_TAG", "rc");
		const { ReleaseChannelBadge } = await import("./release-channel-badge");
		render(<ReleaseChannelBadge />);
		expect(screen.getByText("Release Candidate")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /release candidate/i }),
		).toHaveAttribute("href", "/docs/guides/migrating-to-v1");
	});

	it("renders nothing when RELEASE_TAG is not rc", async () => {
		vi.stubEnv("NEXT_PUBLIC_ARKENV_RELEASE_TAG", "alpha");
		vi.stubEnv("ARKENV_RELEASE_TAG", "alpha");
		const { ReleaseChannelBadge } = await import("./release-channel-badge");
		const { container } = render(<ReleaseChannelBadge />);
		expect(container).toBeEmptyDOMElement();
	});
});
