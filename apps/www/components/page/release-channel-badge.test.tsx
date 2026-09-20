import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("ReleaseChannelBadge", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.resetModules();
	});

	it("renders the RC announcement chip when RELEASE_TAG is rc", async () => {
		vi.stubEnv("NEXT_PUBLIC_ARKENV_RELEASE_TAG", "rc");
		vi.stubEnv("ARKENV_RELEASE_TAG", "rc");
		const { ReleaseChannelBadge } = await import("./release-channel-badge");
		render(<ReleaseChannelBadge />);
		expect(screen.getByText(/v1 RC is out/i)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /v1 RC is out/i })).toHaveAttribute(
			"href",
			"/blog/arkenv-v1-rc",
		);
	});

	it("renders nothing when RELEASE_TAG is not rc", async () => {
		vi.stubEnv("NEXT_PUBLIC_ARKENV_RELEASE_TAG", "alpha");
		vi.stubEnv("ARKENV_RELEASE_TAG", "alpha");
		const { ReleaseChannelBadge } = await import("./release-channel-badge");
		const { container } = render(<ReleaseChannelBadge />);
		expect(container).toBeEmptyDOMElement();
	});
});
