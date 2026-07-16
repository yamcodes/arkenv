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

		const cli3 = new CLI(["node", "arkenv", "init"]);
		expect(cli3.noCodegen).toBe(false);
		expect(cli3.initInput.noCodegen).toBeUndefined();
	});

	it("should reject the removed -C alias as an unknown argument", () => {
		const cli = new CLI(["node", "arkenv", "init", "-C"]);
		expect(cli.noCodegen).toBe(false);
		expect(cli.validationError).toBe("Unknown argument: -C");
	});

	it("should still accept --example in long form", () => {
		const cli = new CLI([
			"node",
			"arkenv",
			"init",
			"--example",
			"with-vite-react",
		]);
		expect(cli.example).toBe("with-vite-react");
		expect(cli.validationError).toBeUndefined();
	});

	it("should reject the reserved -e alias as an unknown argument", () => {
		const cli = new CLI(["node", "arkenv", "init", "-e", "with-vite-react"]);
		expect(cli.example).toBeUndefined();
		expect(cli.validationError).toBe("Unknown argument: -e");
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

		it("should reject the removed -a alias as an unknown argument", () => {
			const cli = new CLI(["node", "arkenv", "init", "-a"]);
			expect(cli.isAgent).toBe(false);
			expect(cli.validationError).toBe("Unknown argument: -a");
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

		it("should reject bundles containing removed aliases (-a, -C)", () => {
			const cli1 = new CLI(["node", "arkenv", "init", "-ya"]);
			expect(cli1.isAgent).toBe(false);
			expect(cli1.validationError).toBe("Unknown argument: -a");

			const cli2 = new CLI(["node", "arkenv", "init", "-yC"]);
			expect(cli2.noCodegen).toBe(false);
			expect(cli2.validationError).toBe("Unknown argument: -C");
		});

		it("should reject the reserved -e alias when bundled with other short flags", () => {
			const cli = new CLI(["node", "arkenv", "init", "-ye"]);
			expect(cli.example).toBeUndefined();
			expect(cli.validationError).toBe("Unknown argument: -e");
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

		it("should not expand flag values immediately following value-taking flags (e.g. -H / --example)", () => {
			const cli1 = new CLI(["node", "arkenv", "init", "-H", "-yq"]);
			expect(cli1.args).toEqual(["init", "-H", "-yq"]);
			expect(cli1.isYes).toBe(false);
			expect(cli1.isQuiet).toBe(false);
			expect(cli1.validationError).toBe("Missing value for option: -H");

			const cli2 = new CLI(["node", "arkenv", "init", "--example", "-abc"]);
			expect(cli2.args).toEqual(["init", "--example", "-abc"]);
			expect(cli2.isAgent).toBe(false);
			expect(cli2.validationError).toBe("Missing value for option: --example");
		});

		it("should expand a bundle ending in a value-taking flag and parse its value correctly", () => {
			const cli = new CLI(["node", "arkenv", "init", "-yqH", "netlify"]);
			expect(cli.isYes).toBe(true);
			expect(cli.isQuiet).toBe(true);
			expect(cli.hostPreset).toBe("netlify");
			expect(cli.validationError).toBeUndefined();
		});

		it("should not expand dash-prefixed values after bundled value-taking flags", () => {
			const cli = new CLI(["node", "arkenv", "init", "-yqH", "-abc"]);
			expect(cli.args).toEqual(["init", "-y", "-q", "-H", "-abc"]);
			expect(cli.isYes).toBe(true);
			expect(cli.isQuiet).toBe(true);
			expect(cli.isAgent).toBe(false);
			expect(cli.validationError).toBe("Missing value for option: -H");
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

			const cli2 = new CLI(["node", "arkenv", "init", "--host-preset"]);
			expect(cli2.validationError).toBe(
				"Missing value for option: --host-preset",
			);

			const cli3 = new CLI(["node", "arkenv", "init", "--example", "--yes"]);
			expect(cli3.validationError).toBe("Missing value for option: --example");

			const cli4 = new CLI(["node", "arkenv", "init", "-yqH"]);
			expect(cli4.validationError).toBe("Missing value for option: -H");
		});
	});

	describe("Strict and Simple flags", () => {
		it("should parse --strict flag", () => {
			const cli = new CLI(["node", "arkenv", "init", "--strict"]);
			expect(cli.isStrict).toBe(true);
			expect(cli.isSimple).toBe(false);
			expect(cli.validationError).toBeUndefined();
		});

		it("should parse --simple flag", () => {
			const cli = new CLI(["node", "arkenv", "init", "--simple"]);
			expect(cli.isStrict).toBe(false);
			expect(cli.isSimple).toBe(true);
			expect(cli.validationError).toBeUndefined();
		});

		it("should parse --flat flag", () => {
			const cli = new CLI(["node", "arkenv", "init", "--flat"]);
			expect(cli.isStrict).toBe(false);
			expect(cli.isSimple).toBe(false);
			expect(cli.isFlat).toBe(true);
			expect(cli.validationError).toBeUndefined();
		});

		it("should parse --host-preset flag", () => {
			const cli1 = new CLI([
				"node",
				"arkenv",
				"init",
				"--host-preset",
				"vercel",
			]);
			expect(cli1.hostPreset).toBe("vercel");
			expect(cli1.initInput.hostPreset).toBe("vercel");
			expect(cli1.validationError).toBeUndefined();

			const cli2 = new CLI([
				"node",
				"arkenv",
				"init",
				"--host-preset",
				"netlify",
			]);
			expect(cli2.hostPreset).toBe("netlify");
			expect(cli2.initInput.hostPreset).toBe("netlify");
			expect(cli2.validationError).toBeUndefined();

			const cli3 = new CLI(["node", "arkenv", "init", "--host-preset", "none"]);
			expect(cli3.hostPreset).toBe("none");
			expect(cli3.initInput.hostPreset).toBe("none");
			expect(cli3.validationError).toBeUndefined();

			const cli4 = new CLI([
				"node",
				"arkenv",
				"init",
				"--host-preset",
				"vercle",
			]);
			expect(cli4.validationError).toBe("Invalid host preset: vercle");
		});

		it("should parse the -H alias for --host-preset", () => {
			const cli = new CLI(["node", "arkenv", "init", "-H", "netlify"]);
			expect(cli.hostPreset).toBe("netlify");
			expect(cli.initInput.hostPreset).toBe("netlify");
			expect(cli.validationError).toBeUndefined();

			const invalid = new CLI(["node", "arkenv", "init", "-H", "vercle"]);
			expect(invalid.validationError).toBe("Invalid host preset: vercle");
		});

		describe("add command", () => {
			it("should parse valid add host vercel command", () => {
				const cli = new CLI(["node", "arkenv", "add", "host", "vercel"]);
				expect(cli.command).toBe("add");
				expect(cli.addInput.provider).toBe("vercel");
				expect(cli.validationError).toBeUndefined();
			});

			it("should parse valid add host netlify command", () => {
				const cli = new CLI(["node", "arkenv", "add", "host", "netlify"]);
				expect(cli.command).toBe("add");
				expect(cli.addInput.provider).toBe("netlify");
				expect(cli.validationError).toBeUndefined();
			});

			it("should parse valid add host command with omitted provider", () => {
				const cli = new CLI(["node", "arkenv", "add", "host"]);
				expect(cli.command).toBe("add");
				expect(cli.addInput.provider).toBeUndefined();
				expect(cli.validationError).toBeUndefined();
			});

			it("should parse isYes in addInput when --yes or --agent flag is passed", () => {
				const cli1 = new CLI(["node", "arkenv", "add", "host", "--yes"]);
				expect(cli1.command).toBe("add");
				expect(cli1.addInput.isYes).toBe(true);

				const cli2 = new CLI(["node", "arkenv", "add", "host", "--agent"]);
				expect(cli2.command).toBe("add");
				expect(cli2.addInput.isYes).toBe(true);
			});

			it("should reject invalid provider", () => {
				const cli = new CLI(["node", "arkenv", "add", "host", "vercle"]);
				expect(cli.validationError).toBe("Invalid host preset: vercle");
			});

			it("should reject non-host subcommand", () => {
				const cli = new CLI(["node", "arkenv", "add", "client"]);
				expect(cli.validationError).toBe("Unknown argument: client");
			});

			it("should reject extra positional arguments", () => {
				const cli = new CLI([
					"node",
					"arkenv",
					"add",
					"host",
					"vercel",
					"extra",
				]);
				expect(cli.validationError).toBe("Unknown argument: extra");
			});
		});
	});
});