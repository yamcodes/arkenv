import { describe, expectTypeOf, it } from "vitest";
// Regression guards: `type` and `Infer` must NOT be re-exported from @arkenv/nextjs.
// Bindings are referenced so @ts-expect-error is only satisfied by a missing export
// (not by noUnusedLocals / TS6133). If a directive ever becomes unused, a re-export
// was accidentally re-introduced.
// @ts-expect-error `type` is not exported from @arkenv/nextjs/client — import from @arkenv/core
import { type as typeFromClient } from "./client";
import { withArkEnv } from "./config";
// @ts-expect-error `Infer` is not exported from @arkenv/nextjs root — import from @arkenv/core
import type { Infer as InferFromRoot } from "./index";
// @ts-expect-error `type` is not exported from @arkenv/nextjs root — import from @arkenv/core
import { arkenv, type as typeFromRoot } from "./index";
// @ts-expect-error `Infer` is not exported from @arkenv/nextjs/react-server — import from @arkenv/core
import type { Infer as InferFromReactServer } from "./react-server";
// @ts-expect-error `type` is not exported from @arkenv/nextjs/react-server — import from @arkenv/core
import { type as typeFromReactServer } from "./react-server";
// @ts-expect-error `type` is not exported from @arkenv/nextjs/server — import from @arkenv/core
import { type as typeFromServer } from "./server";
import arkenvStandard from "./standard";
import { withArkEnv as withArkEnvStandard } from "./standard/config";

void typeFromClient;
void typeFromRoot;
void typeFromServer;
void typeFromReactServer;

type _InferFromRootGuard = InferFromRoot<Record<string, never>>;
type _InferFromReactServerGuard = InferFromReactServer<Record<string, never>>;

export type { _InferFromReactServerGuard, _InferFromRootGuard };

const createMockStandardSchema = <TOutput>(outputValue: TOutput) => ({
	"~standard": {
		version: 1 as const,
		vendor: "mock",
		types: {} as { input: unknown; output: TOutput },
		validate: (_value: unknown) => ({ value: outputValue }),
	},
});

describe("@arkenv/nextjs type regression", () => {
	it("infers client variables as their validated type", () => {
		const env = arkenv({
			server: {
				DATABASE_URL: "string",
			},
			client: {
				NEXT_PUBLIC_API_URL: "string",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
			},
		});

		expectTypeOf(env.NEXT_PUBLIC_API_URL).toBeString();
	});

	it("infers docs-style imports as string values", () => {
		const env = arkenv({
			client: {
				NEXT_PUBLIC_API_URL: "string",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
			},
		});

		const apiUrl = env.NEXT_PUBLIC_API_URL;

		expectTypeOf(apiUrl).toBeString();
	});

	it("validates ArkType schema strings across schema sections", () => {
		arkenv({
			server: {
				DATABASE_URL: "string.url",
				PORT: "number.port = 3000",
			},
			client: {
				NEXT_PUBLIC_API_URL: "string.url",
			},
			shared: {
				NODE_ENV: "'development' | 'production' | 'test' = 'development'",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
				NODE_ENV: "development",
			},
		});
	});

	it("rejects invalid ArkType schema strings across schema sections", () => {
		arkenv({
			server: {
				DATABASE_URL: "not-a-valid-type",
				PORT: "not-a-valid-type",
			},
			client: {
				NEXT_PUBLIC_API_URL: "not-a-valid-type",
			},
			shared: {
				NODE_ENV: "not-a-valid-type",
			},
			// @ts-expect-error invalid ArkType schema string
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
				NODE_ENV: "development",
			},
		});
	});

	it("enforces NEXT_PUBLIC_ client keys", () => {
		// @ts-expect-error client variables must be prefixed with NEXT_PUBLIC_
		arkenv({
			client: {
				NEXT_PUBLIC_API_URL: "string.url",
				API_URL: "string.url",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
				API_URL: "https://api.example.com",
			},
		});
	});

	it("correctly types Flat Mode environment variables and filters them on client", () => {
		const env = arkenv(
			{
				DATABASE_URL: "string",
				NEXT_PUBLIC_API_URL: "string",
				NODE_ENV: "'development' | 'production' | 'test' = 'development'",
				CUSTOM_VAR: "string",
			},
			{
				exposeToClient: ["CUSTOM_VAR"],
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
					NODE_ENV: "development",
					CUSTOM_VAR: "custom_val",
				},
			},
		);

		expectTypeOf(env.NEXT_PUBLIC_API_URL).toBeString();
		expectTypeOf(env.NODE_ENV).toBeString();
		expectTypeOf(env.CUSTOM_VAR).toBeString();

		// @ts-expect-error server-only variable is omitted/never on the client
		env.DATABASE_URL;
	});

	it("correctly types Standard Mode Flat Mode environment variables and filters them on client", () => {
		const env = arkenvStandard(
			{
				DATABASE_URL: createMockStandardSchema(""),
				NEXT_PUBLIC_API_URL: createMockStandardSchema(""),
				NODE_ENV: createMockStandardSchema("development"),
				CUSTOM_VAR: createMockStandardSchema(""),
			},
			{
				exposeToClient: ["CUSTOM_VAR"],
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
					NODE_ENV: "development",
					CUSTOM_VAR: "custom_val",
				},
			},
		);

		expectTypeOf(env.NEXT_PUBLIC_API_URL).toBeString();
		expectTypeOf(env.NODE_ENV).toBeString();
		expectTypeOf(env.CUSTOM_VAR).toBeString();

		// @ts-expect-error server-only variable is omitted/never on the client
		env.DATABASE_URL;
	});
});

declare module "#arkenv/client-env" {
	// biome-ignore lint/style/useConsistentTypeDefinitions: declaration merging requires an interface
	interface ClientEnv {
		NEXT_PUBLIC_API_URL: string;
		NODE_ENV: string;
	}
}

describe("@arkenv/nextjs server auto-extend types (strict layout)", () => {
	it("includes auto-extended client keys in type when extends is omitted", () => {
		// Import via require-cast so the module augmentation above is in scope
		const { arkenv: serverArkenv } =
			require("./server") as typeof import("./server");
		const env = serverArkenv({ DATABASE_URL: "string" });

		expectTypeOf(env.DATABASE_URL).toBeString();
		expectTypeOf(env.NEXT_PUBLIC_API_URL).toBeString();
		expectTypeOf(env.NODE_ENV).toBeString();
	});

	it("keeps explicit extends override types", () => {
		const { arkenv: serverArkenv } =
			require("./server") as typeof import("./server");
		const clientEnv = {
			NEXT_PUBLIC_API_URL: "https://api.example.com",
			CUSTOM_CLIENT: "value",
		};

		const env = serverArkenv(
			{ DATABASE_URL: "string" },
			{ extends: [clientEnv] },
		);

		expectTypeOf(env.DATABASE_URL).toBeString();
		expectTypeOf(env.NEXT_PUBLIC_API_URL).toBeString();
		expectTypeOf(env.CUSTOM_CLIENT).toBeString();
	});
});

describe("withArkEnv config overloads", () => {
	it("preserves object-form nextConfig fields", () => {
		const wrap = () => withArkEnv({ reactStrictMode: true as const });
		expectTypeOf(wrap).returns.toEqualTypeOf<{ reactStrictMode: true }>();
	});

	it("accepts Next.js NextConfig without a string index signature", () => {
		type NextConfigLike = {
			reactStrictMode?: boolean;
			distDir?: string;
		};
		const wrap = () => withArkEnv({} as NextConfigLike);
		expectTypeOf(wrap).returns.toEqualTypeOf<NextConfigLike>();
	});

	it("returns an async factory for sync function-form nextConfig", () => {
		const wrap = () =>
			withArkEnv((phase: string) => ({
				reactStrictMode: phase !== "phase-test",
			}));
		expectTypeOf(wrap).returns.toMatchTypeOf<
			(
				phase: string,
				context: { defaultConfig: unknown },
			) => Promise<{ reactStrictMode: boolean }>
		>();
	});

	it("returns an async factory for async function-form nextConfig", () => {
		const wrap = () =>
			withArkEnv(async (phase: string, { defaultConfig }) => ({
				...(defaultConfig as { poweredByHeader?: boolean }),
				reactStrictMode: phase !== "phase-test",
			}));
		expectTypeOf(wrap).returns.toMatchTypeOf<
			(
				phase: string,
				context: { defaultConfig: unknown },
			) => Promise<{ poweredByHeader?: boolean; reactStrictMode: boolean }>
		>();
	});

	it("matches overloads on the Standard config entry", () => {
		const wrapObject = () =>
			withArkEnvStandard({ reactStrictMode: true as const });
		expectTypeOf(wrapObject).returns.toEqualTypeOf<{
			reactStrictMode: true;
		}>();

		const wrapFunction = () =>
			withArkEnvStandard(async (phase: string) => ({
				reactStrictMode: phase !== "phase-test",
			}));
		expectTypeOf(wrapFunction).returns.toMatchTypeOf<
			(
				phase: string,
				context: { defaultConfig: unknown },
			) => Promise<{ reactStrictMode: boolean }>
		>();
	});
});
