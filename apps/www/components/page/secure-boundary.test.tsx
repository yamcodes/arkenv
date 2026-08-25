import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SecureBoundary } from "./secure-boundary";

describe("SecureBoundary", () => {
	it("shows a Next.js Runtime Error overlay for a client leak", () => {
		render(<SecureBoundary />);

		expect(
			screen.getByRole("heading", {
				name: "Full-stack ready",
			}),
		).toBeInTheDocument();
		expect(screen.getByText(/client bundle/i).closest("p")).toHaveTextContent(
			"Native integrations for modern frameworks. No server variables leak to the client bundle.",
		);
		const workbench = screen.getByRole("img", {
			name: /runtime error for a client leak of DATABASE_URL/i,
		});
		expect(workbench).toHaveTextContent("localhost:3000");
		expect(workbench).toHaveTextContent("Runtime Error");
		expect(workbench).toHaveTextContent(
			"Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
		);
		expect(workbench).toHaveTextContent(
			"app/components/header.tsx (5:12) @ Header",
		);
		expect(workbench).not.toHaveTextContent("return (");
		expect(workbench).toHaveTextContent("<span>{env.DATABASE_URL}</span>");
		expect(workbench).not.toHaveTextContent("Call Stack");
		expect(
			screen.queryByRole("button", { name: "Copy" }),
		).not.toBeInTheDocument();
	});
});
