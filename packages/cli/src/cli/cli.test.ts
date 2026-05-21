import { describe, expect, it } from "vitest";
import { CLI } from "./cli";

describe("CLI parser", () => {
	it("should parse project name from positional argument", () => {
		const cli = new CLI(["node", "arkenv", "init", "my-project"]);
		expect(cli.command).toBe("init");
		expect(cli.name).toBe("my-project");
		expect(cli.validationError).toBeUndefined();
	});

	it("should parse project name with other boolean flags", () => {
		const cli = new CLI([
			"node",
			"arkenv",
			"init",
			"my-project",
			"--yes",
			"--force",
		]);
		expect(cli.command).toBe("init");
		expect(cli.name).toBe("my-project");
		expect(cli.isYes).toBe(true);
		expect(cli.isForce).toBe(true);
		expect(cli.validationError).toBeUndefined();
	});

	it("should parse project name with valued example flag", () => {
		const cli = new CLI([
			"node",
			"arkenv",
			"init",
			"--example",
			"with-vite-react",
			"my-project",
		]);
		expect(cli.command).toBe("init");
		expect(cli.example).toBe("with-vite-react");
		expect(cli.name).toBe("my-project");
		expect(cli.validationError).toBeUndefined();
	});

	it("should parse dot as project name", () => {
		const cli = new CLI(["node", "arkenv", "init", "."]);
		expect(cli.command).toBe("init");
		expect(cli.name).toBe(".");
		expect(cli.validationError).toBeUndefined();
	});

	it("should set name to undefined if no positional argument is provided", () => {
		const cli = new CLI(["node", "arkenv", "init", "--yes"]);
		expect(cli.command).toBe("init");
		expect(cli.name).toBeUndefined();
		expect(cli.validationError).toBeUndefined();
	});

	it("should reject multiple positional arguments", () => {
		const cli = new CLI(["node", "arkenv", "init", "project1", "project2"]);
		expect(cli.validationError).toBe("Unknown argument: project2");
	});

	it("should reject --name / -n flags as unknown arguments", () => {
		const cli1 = new CLI(["node", "arkenv", "init", "--name", "foo"]);
		expect(cli1.validationError).toBe("Unknown argument: --name");

		const cli2 = new CLI(["node", "arkenv", "init", "-n", "foo"]);
		expect(cli2.validationError).toBe("Unknown argument: -n");
	});

	it("should reject any other unknown flags", () => {
		const cli = new CLI(["node", "arkenv", "init", "--foo"]);
		expect(cli.validationError).toBe("Unknown argument: --foo");
	});
});
