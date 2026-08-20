export const HERO_MVP_HOSTS = [
	{ id: "vanilla", label: "Vanilla" },
	{ id: "vite", label: "Vite" },
	{ id: "next", label: "Next.js" },
] as const;

export const HERO_MVP_VALIDATORS = [
	{ id: "arktype", label: "ArkType" },
	{ id: "zod", label: "Zod" },
	{ id: "valibot", label: "Valibot" },
] as const;

export type HeroMvpHostId = (typeof HERO_MVP_HOSTS)[number]["id"];
export type HeroMvpValidatorId = (typeof HERO_MVP_VALIDATORS)[number]["id"];

export type HeroMvpSnippet = {
	host: HeroMvpHostId;
	validator: HeroMvpValidatorId;
	importLine: string;
	code: string;
};

function publicUrlKey(host: HeroMvpHostId) {
	if (host === "next") return "NEXT_PUBLIC_API_URL";
	if (host === "vite") return "VITE_API_URL";
	return null;
}

export type HeroMvpEnvField = {
	name: string;
	type: "string" | "number";
};

/**
 * Inferred `env` shape for the slogan hover — same keys as the matching snippet.
 */
export function heroMvpEnvType(
	host: HeroMvpHostId,
	validator: HeroMvpValidatorId,
): HeroMvpEnvField[] {
	const fields: HeroMvpEnvField[] = [{ name: "DATABASE_URL", type: "string" }];
	const publicKey = publicUrlKey(host);
	if (publicKey) fields.push({ name: publicKey, type: "string" });
	if (validator !== "arktype" || host === "vanilla") {
		fields.push({ name: "PORT", type: "number" });
	}
	return fields;
}

function importBlock(host: HeroMvpHostId, validator: HeroMvpValidatorId) {
	if (validator === "valibot") {
		return `import arkenv from "@arkenv/standard";
import * as v from "valibot";
import { toJsonSchema } from "@valibot/to-json-schema";`;
	}
	if (host === "next") {
		if (validator === "zod") {
			return `import arkenv from "@/generated/env.gen";
import { z } from "zod";`;
		}
		return `import arkenv from "@/generated/env.gen";`;
	}
	if (validator === "arktype") {
		return `import arkenv from "@arkenv/core";`;
	}
	return `import arkenv from "@arkenv/standard";
import { z } from "zod";`;
}

function schemaFields(host: HeroMvpHostId, validator: HeroMvpValidatorId) {
	const publicKey = publicUrlKey(host);
	if (validator === "arktype") {
		const fields = [`  DATABASE_URL: "string.url",`];
		if (publicKey) fields.push(`  ${publicKey}: "string.url",`);
		if (host === "vanilla") fields.push(`  PORT: "number.port = 3000",`);
		return fields.join("\n");
	}
	if (validator === "zod") {
		const fields = ["  DATABASE_URL: z.url(),"];
		if (publicKey) fields.push(`  ${publicKey}: z.url(),`);
		fields.push("  PORT: z.number().int().min(0).max(65535).default(3000),");
		return fields.join("\n");
	}
	const fields = ["    DATABASE_URL: v.pipe(v.string(), v.url()),"];
	if (publicKey) {
		fields.push(`    ${publicKey}: v.pipe(v.string(), v.url()),`);
	}
	fields.push("    PORT: v.optional(v.number(), 3000),");
	return fields.join("\n");
}

function importLine(host: HeroMvpHostId, validator: HeroMvpValidatorId) {
	if (validator === "valibot") return "@arkenv/standard";
	if (host === "next") return "@/generated/env.gen";
	if (validator === "arktype") return "@arkenv/core";
	return "@arkenv/standard";
}

function snippetBody(host: HeroMvpHostId, validator: HeroMvpValidatorId) {
	const fields = schemaFields(host, validator);
	if (validator === "valibot") {
		return `export const env = arkenv(
  {
${fields}
  },
  {
    toJsonSchema: (schema) =>
      toJsonSchema(schema as v.GenericSchema, {
        typeMode: "input",
        target: "draft-07",
      }),
  },
);`;
	}
	return `export const env = arkenv({
${fields}
});`;
}

export function heroMvpSnippet(
	host: HeroMvpHostId,
	validator: HeroMvpValidatorId,
): HeroMvpSnippet {
	return {
		host,
		validator,
		importLine: importLine(host, validator),
		code: `${importBlock(host, validator)}

${snippetBody(host, validator)}`,
	};
}

export const HERO_MVP_SNIPPETS: HeroMvpSnippet[] = HERO_MVP_HOSTS.flatMap(
	(host) =>
		HERO_MVP_VALIDATORS.map((validator) =>
			heroMvpSnippet(host.id, validator.id),
		),
);

export function heroMvpEngine(
	host: HeroMvpHostId,
	validator: HeroMvpValidatorId,
): "arktype" | "standard" {
	return host === "next" && validator !== "arktype" ? "standard" : "arktype";
}
