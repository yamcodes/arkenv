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

	it("should reject any other unknown flags", () => {
		const cli = new CLI(["node", "arkenv", "init", "--foo"]);
		expect(cli.validationError).toBe("Unknown argument: --foo");
	});

	it("should parse no-codegen flag", () => {
		const cli1 = new CLI(["node", "arkenv", "init", "--no-codegen"]);
		expect(cli1.noCodegen).toBe(true);
		expect(cli1.initInput.noCodegen).toBe(true);

		const cli2 = new CLI(["node", "arkenv", "init", "-C"]);
		expect(cli2.noCodegen).toBe(true);
		expect(cli2.initInput.noCodegen).toBe(true);

		const cli3 = new CLI(["node", "arkenv", "init"]);
		expect(cli3.noCodegen).toBe(false);
		expect(cli3.initInput.noCodegen).toBeUndefined();
	});

	describe("Agent presets override", () => {
		it("should set isYes, isQuiet, and isJson to true when --agent is passed", () => {
			const cli = new CLI(["node", "arkenv", "init", "--agent"]);
			expect(cli.isAgent).toBe(true);
			expect(cli.isYes).toBe(true);
			expect(cli.isQuiet).toBe(true);
			expect(cli.isJson).toBe(true);
			expect(cli.isForce).toBe(false);
		});

		it("should set isYes, isQuiet, and isJson to true when -a is passed", () => {
			const cli = new CLI(["node", "arkenv", "init", "-a"]);
			expect(cli.isAgent).toBe(true);
			expect(cli.isYes).toBe(true);
			expect(cli.isQuiet).toBe(true);
			expect(cli.isJson).toBe(true);
			expect(cli.isForce).toBe(false);
		});

		it("should evaluate isYes, isQuiet, and isJson normally when --agent is not passed", () => {
			const cli = new CLI(["node", "arkenv", "init", "--json"]);
			expect(cli.isAgent).toBe(false);
			expect(cli.isYes).toBe(false);
			expect(cli.isQuiet).toBe(false);
			expect(cli.isJson).toBe(true);
		});
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
			expect(cli1.validationError).toBe("Missing value for option: -e");

			const cli2 = new CLI(["node", "arkenv", "init", "--example", "-abc"]);
			expect(cli2.args).toEqual(["init", "--example", "-abc"]);
			expect(cli2.isAgent).toBe(false);
			expect(cli2.validationError).toBe("Missing value for option: --example");
		});

		it("should expand a bundle ending in a value-taking flag and parse its value correctly", () => {
			const cli = new CLI(["node", "arkenv", "init", "-yqe", "my-example"]);
			expect(cli.isYes).toBe(true);
			expect(cli.isQuiet).toBe(true);
			expect(cli.example).toBe("my-example");
			expect(cli.validationError).toBeUndefined();
		});

		it("should not expand dash-prefixed values after bundled value-taking flags", () => {
			const cli = new CLI(["node", "arkenv", "init", "-yqe", "-abc"]);
			expect(cli.args).toEqual(["init", "-y", "-q", "-e", "-abc"]);
			expect(cli.isYes).toBe(true);
			expect(cli.isQuiet).toBe(true);
			expect(cli.isAgent).toBe(false);
			expect(cli.validationError).toBe("Missing value for option: -e");
		});

		it("should ignore single-letter flags with dash or long flags", () => {
			const cli1 = new CLI(["node", "arkenv", "init", "-y"]);
			expect(cli1.isYes).toBe(true);
			expect(cli1.args).toEqual(["init", "-y"]);

			const cli2 = new CLI(["node", "arkenv", "init", "--yes"]);
			expect(cli2.isYes).toBe(true);
			expect(cli2.args).toEqual(["init", "--yes"]);
		});

		it("should reject valued flags passed without a value", () => {
			const cli1 = new CLI(["node", "arkenv", "init", "--example"]);
			expect(cli1.validationError).toBe("Missing value for option: --example");

			const cli2 = new CLI(["node", "arkenv", "init", "-e"]);
			expect(cli2.validationError).toBe("Missing value for option: -e");

			const cli3 = new CLI(["node", "arkenv", "init", "--example", "--yes"]);
			expect(cli3.validationError).toBe("Missing value for option: --example");

			const cli4 = new CLI(["node", "arkenv", "init", "-yqe"]);
			expect(cli4.validationError).toBe("Missing value for option: -e");
		});
	});
});
