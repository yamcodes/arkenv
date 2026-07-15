import path from "node:path";
import { describe, expect, it } from "vitest";
import type { CollectedState } from "./plan";
import { createPlan } from "./planner";

describe("Planner", () => {
	const defaultState: CollectedState = {
		mode: "existing",
		cwd: "/test",
		options: {
			validator: "arktype",
			framework: "vanilla",
			path: "env.ts",
			language: "ts",
			installTypeDefinitions: true,
		},
		detectedFramework: "vanilla",
		packageManager: "pnpm",
		tsConfig: { status: "strict", file: "tsconfig.json" },
		shouldUpdateTsConfig: false,
		existingFiles: ["/test/.env", "/test/.env.example", "/test/.gitignore"],
		isYes: false,
	};

	it("creates a basic plan", () => {
		const plan = createPlan(defaultState);
		expect(plan.files).toHaveLength(1);
		expect(plan.files[0].path).toBe(path.resolve("/test", "env.ts"));
		expect(plan.files[0].action).toBe("create");
		expect(plan.files[0].content).toContain("export");
		expect(plan.files[0].content).toContain("type");
		expect(plan.install?.dependencies).toContain("arkenv");
		expect(plan.install?.dependencies).toContain("arktype");
	});

	it("plans for vite framework", () => {
		const state: CollectedState = {
			...defaultState,
			options: { ...defaultState.options, framework: "vite" },
			detectedFramework: "vite",
		};
		const plan = createPlan(state);
		expect(plan.install?.dependencies).toContain("@arkenv/vite-plugin");
		expect(plan.files.some((f) => f.path.endsWith("vite-env.d.ts"))).toBe(true);
		expect(plan.bootstrap?.framework).toBe("vite");
	});

	it("plans for nextjs framework", () => {
		const state: CollectedState = {
			...defaultState,
			options: { ...defaultState.options, framework: "nextjs" },
			detectedFramework: "nextjs",
		};
		const plan = createPlan(state);
		expect(plan.install?.dependencies).toContain("@arkenv/nextjs");
		expect(plan.files.some((f) => f.path.endsWith("env.d.ts"))).toBe(false);
		expect(plan.bootstrap).toBeDefined();
		expect(plan.bootstrap?.framework).toBe("nextjs");
	});

	it("plans for nextjs framework with disableCodegen", () => {
		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "nextjs",
				disableCodegen: true,
			},
			detectedFramework: "nextjs",
		};
		const plan = createPlan(state);
		expect(plan.install?.dependencies).toContain("@arkenv/nextjs");
		expect(plan.bootstrap).toBeDefined();
		expect(plan.bootstrap?.disableCodegen).toBe(true);
		expect(plan.metadata.disableCodegen).toBe(true);
		const envFile = plan.files.find((f) => f.path.endsWith("env.ts"));
		expect(envFile?.content).toContain('import arkenv from "@arkenv/nextjs";');
		expect(envFile?.content).toContain("runtimeEnv:");
	});

	it("plans for nuxt framework", () => {
		const state: CollectedState = {
			...defaultState,
			options: { ...defaultState.options, framework: "nuxt" },
			detectedFramework: "nuxt",
		};
		const plan = createPlan(state);
		expect(plan.install?.dependencies).toContain("@arkenv/nuxt");
		expect(plan.bootstrap).toBeDefined();
		expect(plan.bootstrap?.framework).toBe("nuxt");
		const envFile = plan.files.find((f) => f.path.endsWith("env.ts"));
		expect(envFile?.content).toContain('import arkenv from "@arkenv/nuxt";');
		expect(envFile?.content).not.toContain("runtimeEnv:");
	});

	it("plans wrapNextjsConfig as true by default for nextjs", () => {
		const state: CollectedState = {
			...defaultState,
			options: { ...defaultState.options, framework: "nextjs" },
			detectedFramework: "nextjs",
		};
		const plan = createPlan(state);
		expect(plan.bootstrap?.wrapNextjsConfig).toBe(true);
	});

	it("plans wrapNextjsConfig as false when opted out", () => {
		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "nextjs",
				wrapNextjsConfig: false,
			},
			detectedFramework: "nextjs",
		};
		const plan = createPlan(state);
		expect(plan.bootstrap?.wrapNextjsConfig).toBe(false);
	});

	it("plans for nextjs framework with zod validator", () => {
		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "nextjs",
				validator: "zod",
			},
			detectedFramework: "nextjs",
		};
		const plan = createPlan(state);
		expect(plan.install?.dependencies).toContain("@arkenv/nextjs");
		expect(plan.install?.dependencies).toContain("zod");
		expect(plan.install?.dependencies).toContain("arktype");
	});

	it("plans for bun-fullstack framework with features", () => {
		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "bun-fullstack",
				bunFeatures: ["serve"],
			},
			detectedFramework: "bun-fullstack",
		};
		const plan = createPlan(state);
		expect(plan.install?.dependencies).toContain("@arkenv/bun-plugin");
		expect(plan.files.some((f) => f.path.endsWith("bun-env.d.ts"))).toBe(true);
		expect(plan.bootstrap?.framework).toBe("bun-fullstack");
		expect(plan.bootstrap?.bunFeatures).toContain("serve");
	});

	it("plans for bun-fullstack framework without features", () => {
		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "bun-fullstack",
				bunFeatures: [],
			},
			detectedFramework: "bun-fullstack",
		};
		const plan = createPlan(state);
		expect(plan.install?.dependencies).not.toContain("@arkenv/bun-plugin");
		expect(plan.files.some((f) => f.path.endsWith("bun-env.d.ts"))).toBe(false);
		expect(plan.bootstrap?.framework).toBe("bun-fullstack");
		expect(plan.bootstrap?.bunFeatures).toEqual([]);
	});

	it("plans tsconfig update when requested", () => {
		const state: CollectedState = {
			...defaultState,
			tsConfig: { status: "not_strict", file: "tsconfig.json" },
			shouldUpdateTsConfig: true,
		};
		const plan = createPlan(state);
		expect(plan.tsConfig?.action).toBe("strict");
		expect(plan.tsConfig?.path).toBe(path.resolve("/test", "tsconfig.json"));
	});

	it("plans overwrite when file exists and allowed", () => {
		const targetPath = path.resolve("/test", "env.ts");
		const state: CollectedState = {
			...defaultState,
			existingFiles: [targetPath],
			options: { ...defaultState.options, overwriteEnvSchemaFile: true },
		};
		const plan = createPlan(state);
		expect(plan.files[0].action).toBe("overwrite");
	});

	it("plans append when type definition exists and requested", () => {
		const typePath = path.resolve("/test", "vite-env.d.ts");
		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "vite",
				envDtsHandling: "append",
			},
			existingFiles: [typePath],
		};
		const plan = createPlan(state);
		const typeFile = plan.files.find((f) => f.path === typePath);
		expect(typeFile?.action).toBe("append");
	});

	it("plans skill installation", () => {
		const state: CollectedState = {
			...defaultState,
			options: { ...defaultState.options, installSkill: true },
		};
		const plan = createPlan(state);
		expect(plan.skill).toBeDefined();
		expect(plan.skill?.packageName).toBe("yamcodes/arkenv");
		expect(plan.skill?.dlxCommand).toEqual(["pnpm", "dlx"]);
	});

	it("normalizes metadata paths", () => {
		const state: CollectedState = {
			...defaultState,
			options: { ...defaultState.options, path: "src/env.ts" },
		};
		const plan = createPlan(state);
		// path.relative will use forward slashes on POSIX, but we want to ensure
		// our normalization handles the output regardless of platform.
		expect(plan.metadata.displayPath).toBe("./src/env.ts");
		expect(plan.metadata.importPath).toBe("./src/env");
	});

	it("sets targetDir to a named subdirectory when name is not '.'", () => {
		const state: CollectedState = {
			...defaultState,
			mode: "new",
			cwd: "/parent",
			options: {
				...defaultState.options,
				mode: "new",
				example: "basic",
				name: "my-app",
				path: "./src/env.ts",
			},
		};
		const plan = createPlan(state);
		expect(plan.clone).toBeDefined();
		expect(plan.clone?.targetDir).toBe("/parent/my-app");
		expect(plan.clone?.targetName).toBe("my-app");
		expect(plan.install?.cwd).toBe("/parent/my-app");
	});

	it("omits targetDir when name is '.' so cloner falls back to cwd", () => {
		const state: CollectedState = {
			...defaultState,
			mode: "new",
			cwd: "/parent",
			options: {
				...defaultState.options,
				mode: "new",
				example: "basic",
				name: ".",
				path: "./src/env.ts",
			},
		};
		const plan = createPlan(state);
		expect(plan.clone).toBeDefined();
		expect(plan.clone?.targetDir).toBeUndefined();
		expect(plan.clone?.targetName).toBe("parent");
		expect(plan.install?.cwd).toBeUndefined();
	});

	it("extracts basename for targetName in new project mode", () => {
		const state: CollectedState = {
			mode: "new",
			cwd: "/test/yo/my-project",
			options: {
				mode: "new",
				example: "basic",
				name: "yo/my-project",
				framework: "vanilla",
				path: "./src/env.ts",
				validator: "arktype",
				language: "ts",
				installSkill: false,
			},
			detectedFramework: "vanilla",
			packageManager: "pnpm",
			tsConfig: { status: "not_found" },
			shouldUpdateTsConfig: false,
			existingFiles: [],
			isYes: false,
		};
		const plan = createPlan(state);
		expect(plan.clone?.targetName).toBe("my-project");
	});

	it("plans three files for nextjs framework in strict layout", () => {
		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "nextjs",
				layout: "strict",
				path: "src/env.ts",
			},
			detectedFramework: "nextjs",
		};
		const plan = createPlan(state);
		expect(plan.files).toHaveLength(3);

		const sharedFile = plan.files.find((f) =>
			f.path.replace(/\\/g, "/").endsWith("env/internal/shared.ts"),
		);
		const clientFile = plan.files.find((f) =>
			f.path.replace(/\\/g, "/").endsWith("env/client.ts"),
		);
		const serverFile = plan.files.find((f) =>
			f.path.replace(/\\/g, "/").endsWith("env/server.ts"),
		);

		expect(sharedFile).toBeDefined();
		expect(clientFile).toBeDefined();
		expect(serverFile).toBeDefined();

		expect(sharedFile?.content).toContain("@arkenv/nextjs/shared");
		expect(clientFile?.content).toContain("./generated/env.gen");
		expect(serverFile?.content).toContain("@arkenv/nextjs/server");
	});

	it("plans all three strict layout files as overwrite on rerun when they already exist", () => {
		const sharedPath = path.resolve("/test", "src/env/internal/shared.ts");
		const clientPath = path.resolve("/test", "src/env/client.ts");
		const serverPath = path.resolve("/test", "src/env/server.ts");

		const state: CollectedState = {
			...defaultState,
			options: {
				...defaultState.options,
				framework: "nextjs",
				layout: "strict",
				path: "src/env.ts",
				overwriteEnvSchemaFile: true,
			},
			detectedFramework: "nextjs",
			existingFiles: [
				sharedPath,
				clientPath,
				serverPath,
				"/test/.env",
				"/test/.env.example",
				"/test/.gitignore",
			],
		};
		const plan = createPlan(state);
		expect(plan.files).toHaveLength(3);

		const sharedFile = plan.files.find((f) => f.path === sharedPath);
		const clientFile = plan.files.find((f) => f.path === clientPath);
		const serverFile = plan.files.find((f) => f.path === serverPath);

		// All three must be "overwrite", not "create"
		expect(sharedFile?.action).toBe("overwrite");
		expect(clientFile?.action).toBe("overwrite");
		expect(serverFile?.action).toBe("overwrite");
	});

	it("resolves nextjsImportPath using tsconfig paths mapping when schema is inside mapped folder", () => {
		const state: CollectedState = {
			...defaultState,
			cwd: "/test",
			options: {
				...defaultState.options,
				framework: "nextjs",
				path: "src/env.ts",
			},
			tsConfig: {
				status: "strict",
				file: "tsconfig.json",
				parsed: {
					path: "/test/tsconfig.json",
					compilerOptions: {
						paths: {
							"@/*": ["./src/*"],
						},
					},
				},
			},
		};
		const plan = createPlan(state);
		const envFile = plan.files.find((f) => f.path.endsWith("env.ts"));
		expect(envFile?.content).toContain(
			'import arkenv from "@/generated/env.gen"',
		);
	});

	it("resolves nextjsImportPath using tsconfig paths mapping with root wildcard mapping", () => {
		const state: CollectedState = {
			...defaultState,
			cwd: "/test",
			options: {
				...defaultState.options,
				framework: "nextjs",
				path: "env.ts",
			},
			tsConfig: {
				status: "strict",
				file: "tsconfig.json",
				parsed: {
					path: "/test/tsconfig.json",
					compilerOptions: {
						paths: {
							"@/*": ["./*"],
						},
					},
				},
			},
		};
		const plan = createPlan(state);
		const envFile = plan.files.find((f) => f.path.endsWith("env.ts"));
		expect(envFile?.content).toContain(
			'import arkenv from "@/generated/env.gen"',
		);
	});

	it("falls back to relative path if schema is outside mapped tsconfig paths folder", () => {
		const state: CollectedState = {
			...defaultState,
			cwd: "/test",
			options: {
				...defaultState.options,
				framework: "nextjs",
				path: "env.ts",
			},
			tsConfig: {
				status: "strict",
				file: "tsconfig.json",
				parsed: {
					path: "/test/tsconfig.json",
					compilerOptions: {
						paths: {
							"@/*": ["./src/*"],
						},
					},
				},
			},
		};
		const plan = createPlan(state);
		const envFile = plan.files.find((f) => f.path.endsWith("env.ts"));
		expect(envFile?.content).toContain(
			'import arkenv from "./generated/env.gen"',
		);
	});

	it("resolves nextjsImportPath in strict layout using tsconfig paths mapping", () => {
		const state: CollectedState = {
			...defaultState,
			cwd: "/test",
			options: {
				...defaultState.options,
				framework: "nextjs",
				layout: "strict",
				path: "src/env.ts",
			},
			tsConfig: {
				status: "strict",
				file: "tsconfig.json",
				parsed: {
					path: "/test/tsconfig.json",
					compilerOptions: {
						paths: {
							"@/*": ["./src/*"],
						},
					},
				},
			},
		};
		const plan = createPlan(state);
		const clientFile = plan.files.find((f) =>
			f.path.replace(/\\/g, "/").endsWith("env/client.ts"),
		);
		expect(clientFile?.content).toContain(
			'import arkenv from "@/env/generated/env.gen"',
		);
	});

	describe("env and env.example generation", () => {
		it("generates .env and .env.example with defaults in new project mode", () => {
			const state: CollectedState = {
				...defaultState,
				mode: "new",
				existingFiles: [],
				options: {
					...defaultState.options,
					mode: "new",
					example: "basic",
					framework: "vanilla",
				},
			};
			const plan = createPlan(state);
			const envFile = plan.files.find((f) => f.path.endsWith("/.env"));
			const envExampleFile = plan.files.find((f) =>
				f.path.endsWith("/.env.example"),
			);

			expect(envFile).toBeDefined();
			expect(envFile?.action).toBe("create");
			expect(envFile?.content).toContain("HOST=localhost");
			expect(envFile?.content).toContain("PORT=3000");

			expect(envExampleFile).toBeDefined();
			expect(envExampleFile?.action).toBe("create");
			expect(envExampleFile?.content).toContain("HOST=localhost");
			expect(envExampleFile?.content).toContain("PORT=3000");
		});

		it("generates .env and .env.example from keys in existing project mode if both are missing", () => {
			const state: CollectedState = {
				...defaultState,
				existingFiles: [],
				options: {
					...defaultState.options,
					envKeys: ["API_KEY", "PORT"],
					framework: "vanilla",
				},
			};
			const plan = createPlan(state);
			const envFile = plan.files.find((f) => f.path.endsWith("/.env"));
			const envExampleFile = plan.files.find((f) =>
				f.path.endsWith("/.env.example"),
			);

			expect(envFile).toBeDefined();
			expect(envFile?.content).toContain("API_KEY=");
			expect(envFile?.content).toContain("PORT=3000");

			expect(envExampleFile).toBeDefined();
			expect(envExampleFile?.content).toContain("API_KEY=");
			expect(envExampleFile?.content).toContain("PORT=3000");
		});

		it("copies .env.example to .env in existing project mode if .env is missing", () => {
			const state: CollectedState = {
				...defaultState,
				existingFiles: ["/test/.env.example"],
				options: {
					...defaultState.options,
					envExampleContent: "SUPER_SECRET_KEY=12345\n",
				},
			};
			const plan = createPlan(state);
			const envFile = plan.files.find((f) => f.path.endsWith("/.env"));
			const envExampleFile = plan.files.find((f) =>
				f.path.endsWith("/.env.example"),
			);

			expect(envFile).toBeDefined();
			expect(envFile?.action).toBe("create");
			expect(envFile?.content).toBe("SUPER_SECRET_KEY=12345\n");

			// .env.example already exists, so it shouldn't be planned for creation
			expect(envExampleFile).toBeUndefined();
		});

		it("copies .env to .env.example with values stripped in existing project mode if .env.example is missing", () => {
			const state: CollectedState = {
				...defaultState,
				existingFiles: ["/test/.env"],
				options: {
					...defaultState.options,
					envContent: `# Database URL
DATABASE_URL=postgres://user:pass@localhost:5432/db
  export API_KEY = "xyz"
UNRELATED=`,
				},
			};
			const plan = createPlan(state);
			const envFile = plan.files.find((f) => f.path.endsWith("/.env"));
			const envExampleFile = plan.files.find((f) =>
				f.path.endsWith("/.env.example"),
			);

			// .env already exists, so it shouldn't be planned for creation
			expect(envFile).toBeUndefined();

			expect(envExampleFile).toBeDefined();
			expect(envExampleFile?.action).toBe("create");
			expect(envExampleFile?.content).toBe(`# Database URL
DATABASE_URL=
  export API_KEY=
UNRELATED=`);
		});

		describe("gitignore checks", () => {
			it("scaffolds .gitignore if it does not exist in existing project mode", () => {
				const state: CollectedState = {
					...defaultState,
					existingFiles: ["/test/.env", "/test/.env.example"], // only gitignore is missing
				};
				const plan = createPlan(state);
				const gitignoreFile = plan.files.find((f) =>
					f.path.endsWith("/.gitignore"),
				);

				expect(gitignoreFile).toBeDefined();
				expect(gitignoreFile?.action).toBe("create");
				expect(gitignoreFile?.content).toContain(".env");
				expect(gitignoreFile?.content).toContain(".env.local");
			});

			it("appends .env and .env.local to existing .gitignore if not ignored", () => {
				const state: CollectedState = {
					...defaultState,
					existingFiles: [
						"/test/.env",
						"/test/.env.example",
						"/test/.gitignore",
					],
					options: {
						...defaultState.options,
						gitignoreContent: "node_modules/\ndist/\n",
					},
				};
				const plan = createPlan(state);
				const gitignoreFile = plan.files.find((f) =>
					f.path.endsWith("/.gitignore"),
				);

				expect(gitignoreFile).toBeDefined();
				expect(gitignoreFile?.action).toBe("overwrite");
				expect(gitignoreFile?.content).toContain("node_modules/");
				expect(gitignoreFile?.content).toContain(".env");
				expect(gitignoreFile?.content).toContain(".env.local");
			});

			it("does not update .gitignore if .env is already ignored", () => {
				const state: CollectedState = {
					...defaultState,
					existingFiles: [
						"/test/.env",
						"/test/.env.example",
						"/test/.gitignore",
					],
					options: {
						...defaultState.options,
						gitignoreContent: "node_modules/\n.env\n",
					},
				};
				const plan = createPlan(state);
				const gitignoreFile = plan.files.find((f) =>
					f.path.endsWith("/.gitignore"),
				);

				expect(gitignoreFile).toBeUndefined();
			});

			it("does not update .gitignore if .env* is already ignored", () => {
				const state: CollectedState = {
					...defaultState,
					existingFiles: [
						"/test/.env",
						"/test/.env.example",
						"/test/.gitignore",
					],
					options: {
						...defaultState.options,
						gitignoreContent: "node_modules/\n.env*\n",
					},
				};
				const plan = createPlan(state);
				const gitignoreFile = plan.files.find((f) =>
					f.path.endsWith("/.gitignore"),
				);

				expect(gitignoreFile).toBeUndefined();
			});
		});

		describe("hostPresets planning", () => {
			it("includes hosting preset keys in generated config and .env templates", () => {
				const state: CollectedState = {
					...defaultState,
					existingFiles: [], // So .env and .env.example will be planned for creation
					options: {
						...defaultState.options,
						hostPreset: "vercel",
					},
				};
				const plan = createPlan(state);
				
				const envTs = plan.files.find((f) => f.path.endsWith("env.ts"));
				const dotenv = plan.files.find((f) => f.path.endsWith(".env"));
				const dotenvExample = plan.files.find((f) => f.path.endsWith(".env.example"));

				expect(envTs).toBeDefined();
				expect(envTs?.content).toContain("VERCEL_URL");
				expect(envTs?.content).toContain("VERCEL_ENV");

				expect(dotenv).toBeDefined();
				expect(dotenv?.content).toContain("VERCEL_ENV=");
				expect(dotenv?.content).toContain("VERCEL_URL=");

				expect(dotenvExample).toBeDefined();
				expect(dotenvExample?.content).toContain("VERCEL_ENV=");
				expect(dotenvExample?.content).toContain("VERCEL_URL=");
			});
		});
	});
});
