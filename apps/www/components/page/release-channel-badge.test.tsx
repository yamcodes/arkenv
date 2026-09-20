import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReleaseChannelBadge } from "./release-channel-badge";

describe("ReleaseChannelBadge", () => {
	it("renders a compact RC link to the migration guide when releaseTag is rc", () => {
		render(<ReleaseChannelBadge releaseTag="rc" />);
		const link = screen.getByRole("link", {
			name: /release candidate — migrate to v1/i,
		});
		expect(link).toHaveTextContent("RC");
		expect(link).toHaveAttribute("href", "/docs/guides/migrating-to-v1");
		expect(link).toHaveAttribute("title", "Release Candidate — migrate to v1");
	});

	it("renders nothing when releaseTag is not rc", () => {
		const { container } = render(<ReleaseChannelBadge releaseTag="alpha" />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders nothing when releaseTag is empty (GA)", () => {
		const { container } = render(<ReleaseChannelBadge releaseTag="" />);
		expect(container).toBeEmptyDOMElement();
	});
});
