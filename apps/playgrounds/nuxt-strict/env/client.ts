import arkenv from "@arkenv/nuxt/client";

export const env = arkenv({
	NUXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
	NUXT_PUBLIC_PORT: "number = 3000",
	NUXT_PUBLIC_FEATURE_FLAG: "boolean = false",
});
