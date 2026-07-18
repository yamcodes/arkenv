// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: ["@arkenv/nuxt/module"],
	arkenv: {
		schemaPath: "env",
		layout: "strict",
	},
});
