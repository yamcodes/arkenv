import arkenv from "arkenv";

const env = arkenv({
	TURSO_DATABASE_URL: "string.url", // ❌ TypeScript error in Bun
});

console.log({
	url: env.TURSO_DATABASE_URL,
});
