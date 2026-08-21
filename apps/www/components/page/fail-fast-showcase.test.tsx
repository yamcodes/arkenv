import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FailFastShowcase } from "./fail-fast-showcase";

describe("FailFastShowcase", () => {
	it("shows a terminal ArkEnvError dump from npm run dev", () => {
		render(<FailFastShowcase />);

		expect(
			screen.getByRole("heading", { name: "Fail fast at boot." }),
		).toBeInTheDocument();
		const workbench = screen.getByRole("img", {
			name: /terminal running npm run dev/i,
		});
		expect(workbench).toHaveTextContent(">_");
		expect(workbench).toHaveTextContent("npm run dev");
		expect(workbench).not.toHaveTextContent("Terminal");
		expect(workbench).not.toHaveTextContent("$ npm run dev");
		expect(workbench).toHaveTextContent(
			"ready - started server on 0.0.0.0:3000, url: http://localhost:3000",
		);
		expect(workbench).toHaveTextContent("info - loaded env from .env");
		expect(workbench).toHaveTextContent(
			"DATABASE_URL must be a URL string (was [REDACTED])",
		);
		expect(workbench).toHaveTextContent("PORT must be a number (was a string)");
		expect(workbench).not.toHaveTextContent("at arkenv");
		expect(workbench).not.toHaveTextContent("./app.ts");
		expect(workbench).not.toHaveTextContent("node:internal");
		expect(workbench).not.toHaveTextContent("import { env }");
		expect(workbench).not.toHaveTextContent("Process Exited");
		expect(workbench).not.toHaveTextContent("RUNTIME ERROR");
	});
});
