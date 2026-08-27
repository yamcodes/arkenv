export const HERO_MVP_HOSTS = [
	{ id: "vanilla", label: "Vanilla" },
	{ id: "vite", label: "Vite" },
	{ id: "next", label: "Next.js" },
] as const;

export const HERO_MVP_VALIDATORS = [
	{ id: "arktype", label: "ArkType" },
	{ id: "zod", label: "Zod" },
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
	type: "string" | "number" | "boolean";
};

/**
 * Inferred `env` shape for the slogan hover — same keys as the matching snippet.
 */
export function heroMvpEnvType(
	host: HeroMvpHostId,
	_validator: HeroMvpValidatorId,
): HeroMvpEnvField[] {
	const fields: HeroMvpEnvField[] = [{ name: "DATABASE_URL", type: "string" }];
	const publicKey = publicUrlKey(host);
	if (publicKey) fields.push({ name: publicKey, type: "string" });
	fields.push({ name: "PORT", type: "number" });
	fields.push({ name: "CI", type: "boolean" });
	return fields;
}

function importBlock(host: HeroMvpHostId, validator: HeroMvpValidatorId) {
	if (host === "next") {
		if (validator === "zod") {
			return `import arkenv from "@/.arkenv";
import { z } from "zod";`;
		}
		return `import arkenv from "@/.arkenv";`;
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
		fields.push(`  PORT: "0 <= number.integer <= 65535 = 3000",`);
		fields.push(`  CI: "boolean = false",`);
		return fields.join("\n");
	}
	const fields = ["  DATABASE_URL: z.url(),"];
	if (publicKey) fields.push(`  ${publicKey}: z.url(),`);
	fields.push("  PORT: z.number().int().min(0).max(65535).default(3000),");
	fields.push("  CI: z.boolean().default(false),");
	return fields.join("\n");
}

function importLine(host: HeroMvpHostId, validator: HeroMvpValidatorId) {
	if (host === "next") return "@/.arkenv";
	if (validator === "arktype") return "@arkenv/core";
	return "@arkenv/standard";
}

function snippetBody(host: HeroMvpHostId, validator: HeroMvpValidatorId) {
	return `export const env = arkenv({
${schemaFields(host, validator)}
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
