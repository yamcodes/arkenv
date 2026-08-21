import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { InkTabList } from "./ink-tabs";

const ITEMS = [
	{ id: "arktype" as const, label: "ArkType" },
	{ id: "zod" as const, label: "Zod" },
];

describe("InkTabList", () => {
	it("marks the active tab and moves selection on click", async () => {
		const user = userEvent.setup();
		let value: "arktype" | "zod" = "arktype";
		const onChange = (id: "arktype" | "zod") => {
			value = id;
		};

		const { rerender } = render(
			<InkTabList
				label="Validator"
				value={value}
				items={ITEMS}
				controls="panel"
				onChange={onChange}
			/>,
		);

		expect(screen.getByRole("tab", { name: "ArkType" })).toHaveAttribute(
			"aria-selected",
			"true",
		);

		await user.click(screen.getByRole("tab", { name: "Zod" }));
		rerender(
			<InkTabList
				label="Validator"
				value={value}
				items={ITEMS}
				controls="panel"
				onChange={onChange}
			/>,
		);

		expect(screen.getByRole("tab", { name: "Zod" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByRole("tab", { name: "ArkType" })).toHaveAttribute(
			"aria-selected",
			"false",
		);
	});
});
