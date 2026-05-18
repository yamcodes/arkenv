import dedent from "dedent";

export const viteZodExample = () => {
	return dedent /* ts */`
    import { z } from "zod";

    /**
     * Environment variable schema using Zod.
     * In Vite, use \`@arkenv/vite-plugin\` to validate these at build-time.
     */
    export const Env = z.object({
      VITE_API_URL: z.string().url().default("https://api.example.com"),
      VITE_ENABLE_FEATURE_X: z.enum(["true", "false"]).default("false"),
      NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    });
  `;
};

export const nextArktypeExample = () => {
	return dedent /* ts */`
    import arkenv, { type } from "arkenv";

    /**
     * Environment variable schema using ArkType.
     * Optimized for Next.js with both server and client-side support.
     */
    export const Env = type({
      NEXT_PUBLIC_API_URL: "string.url = 'https://api.example.com'",
      DATABASE_URL: "string.url",
      NODE_ENV: "'development' | 'production' | 'test' = 'development'",
    });

    export const env = arkenv(Env);
  `;
};

export const basicValibotExample = () => {
	return dedent /* ts */`
    import arkenv from "arkenv";
    import * as v from "valibot";

    /**
     * Basic environment variable schema using Valibot.
     */
    export const Env = v.object({
      PORT: v.optional(v.pipe(v.string(), v.transform(Number)), 3000),
      HOST: v.optional(v.string(), "localhost"),
    });

    export const env = arkenv(Env);
  `;
};
