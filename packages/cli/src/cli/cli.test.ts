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

	describe("POSIX-style short-flag bundling", () => {
		it("should expand a simple bundle of short flags", () => {
			const cli = new CLI(["node", "arkenv", "init", "-yq"]);
			expect(cli.isYes).toBe(true);
			expect(cli.isQuiet).toBe(true);
			expect(cli.validationError).toBeUndefined();
		});

		it("should expand a bundle of multiple short flags including force", () => {
			const cli = new CLI(["node", "arkenv", "init", "-yfq"]);
			expect(cli.isYes).toBe(true);
			expect(cli.isForce).toBe(true);
			expect(cli.isQuiet).toBe(true);
			expect(cli.validationError).toBeUndefined();
		});

		it("should preserve positional arguments alongside expanded bundles", () => {
			const cli = new CLI(["node", "arkenv", "init", "-yq", "my-project"]);
			expect(cli.isYes).toBe(true);
			expect(cli.isQuiet).toBe(true);
			expect(cli.name).toBe("my-project");
			expect(cli.validationError).toBeUndefined();
		});

		it("should not expand flag values immediately following value-taking flags (e.g. -e / --example)", () => {
			const cli1 = new CLI(["node", "arkenv", "init", "-e", "-yq"]);
			expect(cli1.args).toEqual(["init", "-e", "-yq"]);
			expect(cli1.isYes).toBe(false);
			expect(cli1.isQuiet).toBe(false);
			expect(cli1.validationError).toBe("Unknown argument: -yq");

			const cli2 = new CLI(["node", "arkenv", "init", "--example", "-abc"]);
			expect(cli2.args).toEqual(["init", "--example", "-abc"]);
			expect(cli2.isAgent).toBe(false);
			expect(cli2.validationError).toBe("Unknown argument: -abc");
		});

		it("should not expand flag values immediately following name flags (e.g. -n / --name)", () => {
			const cli1 = new CLI(["node", "arkenv", "init", "-n", "-yq"]);
			expect(cli1.isYes).toBe(false);
			expect(cli1.isQuiet).toBe(false);
			// -n itself is not a known flag, so we expect a validation error on -n, but no expansion of -yq.
			expect(cli1.validationError).toBe("Unknown argument: -n");

			const cli2 = new CLI(["node", "arkenv", "init", "--name", "-abc"]);
			expect(cli2.isAgent).toBe(false);
			expect(cli2.validationError).toBe("Unknown argument: --name");
		});

		it("should expand a bundle ending in a value-taking flag and parse its value correctly", () => {
			const cli = new CLI(["node", "arkenv", "init", "-yqe", "my-example"]);
			expect(cli.isYes).toBe(true);
			expect(cli.isQuiet).toBe(true);
			expect(cli.example).toBe("my-example");
			expect(cli.validationError).toBeUndefined();
		});

		it("should ignore single-letter flags with dash or long flags", () => {
			const cli1 = new CLI(["node", "arkenv", "init", "-y"]);
			expect(cli1.isYes).toBe(true);
			expect(cli1.args).toEqual(["init", "-y"]);

			const cli2 = new CLI(["node", "arkenv", "init", "--yes"]);
			expect(cli2.isYes).toBe(true);
			expect(cli2.args).toEqual(["init", "--yes"]);
		});
	});
});
