import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FailFastShowcase } from "./fail-fast-showcase";

describe("FailFastShowcase", () => {
	it("shows a terminal ArkEnvError dump from npm run dev", () => {
		render(<FailFastShowcase />);

		expect(
			screen.getByRole("heading", { name: "Fail-fast at boot" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(/fails loudly and early/i).closest("p"),
		).toHaveTextContent(
			"Missing or malformed variables shouldn't silently crash production. ArkEnv fails loudly and early.",
		);
		const workbench = screen.getByRole("img", {
			name: /terminal running npm run dev/i,
		});
		expect(workbench).toHaveTextContent("$ npm run dev");
		expect(workbench).not.toHaveTextContent("validating environment...");
		expect(
			workbench.querySelectorAll(".home-aurora__install-prompt-symbol"),
		).toHaveLength(1);
		expect(workbench.querySelector(".home-aurora__tty-info")).toBeNull();
		expect(workbench).not.toHaveTextContent(">_");
		expect(workbench).not.toHaveTextContent("Terminal");
		expect(workbench).not.toHaveTextContent("> npm run dev");
		expect(workbench).not.toHaveTextContent("ready");
		expect(workbench).not.toHaveTextContent("started server");
		expect(workbench).not.toHaveTextContent("0.0.0.0:3000");
		expect(workbench).not.toHaveTextContent("loaded env from .env");
		expect(workbench).not.toHaveTextContent("Invalid environment variables");
		expect(workbench).toHaveTextContent(
			"ArkEnvError: Errors found while validating environment variables",
		);
		expect(workbench).toHaveTextContent(
			"DATABASE_URL must be a URL string (was [REDACTED])",
		);
		expect(workbench).toHaveTextContent("PORT must be a number (was a string)");
		expect(workbench.querySelector(".home-aurora__tty-err")).toHaveTextContent(
			"Errors found while validating environment variables",
		);
		expect(workbench.querySelector(".home-aurora__tty-val")).toHaveTextContent(
			"[REDACTED]",
		);
		expect(workbench).not.toHaveTextContent("at arkenv");
		expect(workbench).not.toHaveTextContent("./app.ts");
		expect(workbench).not.toHaveTextContent("node:internal");
		expect(workbench).not.toHaveTextContent("import { env }");
		expect(workbench).not.toHaveTextContent("Process Exited");
		expect(workbench).not.toHaveTextContent("RUNTIME ERROR");
	});
});
