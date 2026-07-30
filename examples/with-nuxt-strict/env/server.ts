import arkenv from "@arkenv/nuxt/server";

export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
});
