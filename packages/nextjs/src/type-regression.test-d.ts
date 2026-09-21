import { describe, expectTypeOf, it } from "vitest";
// Regression guards: `type` and `Infer` must NOT be re-exported from @arkenv/nextjs.
// Bindings are referenced so @ts-expect-error is only satisfied by a missing export
// (not by noUnusedLocals / TS6133). If a directive ever becomes unused, a re-export
// was accidentally re-introduced.
import { withArkEnv } from "./config";
// @ts-expect-error `Infer` is not exported from @arkenv/nextjs root — import from @arkenv/core
import type { Infer as InferFromRoot } from "./index";
// @ts-expect-error `type` is not exported from @arkenv/nextjs root — import from @arkenv/core
import { arkenv, type as typeFromRoot } from "./index";
// @ts-expect-error `Infer` is not exported from @arkenv/nextjs/react-server — import from @arkenv/core
import type { Infer as InferFromReactServer } from "./react-server";
// @ts-expect-error `type` is not exported from @arkenv/nextjs/react-server — import from @arkenv/core
import { type as typeFromReactServer } from "./react-server";
import arkenvStandard from "./standard";
import { withArkEnv as withArkEnvStandard } from "./standard/config";

void typeFromRoot;
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
		const env = arkenv(
			{
				DATABASE_URL: "string",
				NEXT_PUBLIC_API_URL: "string",
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
				},
			},
		);

		expectTypeOf(env.NEXT_PUBLIC_API_URL).toBeString();
	});

	it("infers docs-style imports as string values", () => {
		const env = arkenv(
			{
				NEXT_PUBLIC_API_URL: "string",
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
				},
			},
		);

		const apiUrl = env.NEXT_PUBLIC_API_URL;

		expectTypeOf(apiUrl).toBeString();
	});

	it("validates ArkType schema strings in the flat schema", () => {
		arkenv(
			{
				DATABASE_URL: "string.url",
				PORT: "number.port = 3000",
				NEXT_PUBLIC_API_URL: "string.url",
				NODE_ENV: "'development' | 'production' | 'test' = 'development'",
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
					NODE_ENV: "development",
				},
			},
		);
	});

	it("rejects invalid ArkType schema strings in the flat schema", () => {
		arkenv(
			{
				// @ts-expect-error invalid ArkType schema string
				DATABASE_URL: "not-a-valid-type",
				NEXT_PUBLIC_API_URL: "string.url",
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
				},
			},
		);
	});

	it("rejects the removed nested bag at the type level", () => {
		arkenv(
			// @ts-expect-error nested bag was removed — use flat arkenv(schema, options)
			{
				server: {
					DATABASE_URL: "string",
				},
				client: {
					NEXT_PUBLIC_API_URL: "string",
				},
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
				},
			},
		);
	});

	it("rejects removed expose / shared option aliases", () => {
		arkenv(
			{
				CUSTOM_VAR: "string",
				NEXT_PUBLIC_API_URL: "string",
			},
			{
				// @ts-expect-error expose alias was removed — use exposeToClient
				expose: ["CUSTOM_VAR"],
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
				},
			},
		);
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

describe("withArkEnv config overloads", () => {
	it("preserves object-form nextConfig fields", () => {
		const wrap = () => withArkEnv({ reactStrictMode: true as const });
		expectTypeOf(wrap).returns.toEqualTypeOf<{ reactStrictMode: true }>();
	});

	it("accepts Next.js NextConfig without a string index signature", () => {
		// Must be an interface: type aliases get an implicit index signature, so they
		// would not catch a `Record<string, unknown>` constraint the way Next 16's
		// bare `interface NextConfig` does.
		// biome-ignore lint/style/useConsistentTypeDefinitions: match NextConfig (interface, no index signature)
		interface NextConfigLike {
			reactStrictMode?: boolean;
			distDir?: string;
		}
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
				context: { defaultConfig: {} },
			) => Promise<{ reactStrictMode: boolean }>
		>();
	});

	it("returns an async factory for async function-form nextConfig", () => {
		const wrap = () =>
			withArkEnv(async (phase: string, { defaultConfig }) => ({
				...defaultConfig,
				reactStrictMode: phase !== "phase-test",
			}));
		expectTypeOf(wrap).returns.toMatchTypeOf<
			(
				phase: string,
				context: { defaultConfig: {} },
			) => Promise<{ reactStrictMode: boolean }>
		>();
	});

	it("typechecks the docs function-form snippet with a NextConfig-like return", () => {
		// biome-ignore lint/style/useConsistentTypeDefinitions: match NextConfig (interface, no index signature)
		interface NextConfigLike {
			reactStrictMode?: boolean;
		}
		const wrap = () =>
			withArkEnv(
				async (phase: string, { defaultConfig }): Promise<NextConfigLike> => ({
					...defaultConfig,
					reactStrictMode: phase !== "phase-test",
				}),
			);
		expectTypeOf(wrap).returns.toMatchTypeOf<
			(phase: string, context: { defaultConfig: {} }) => Promise<NextConfigLike>
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
				context: { defaultConfig: {} },
			) => Promise<{ reactStrictMode: boolean }>
		>();
	});
});
