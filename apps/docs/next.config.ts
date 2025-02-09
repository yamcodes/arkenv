import { createMDX } from "fumadocs-mdx/next";
import { BASE_URL } from "~/config/constants";

export default createMDX()({
	reactStrictMode: true,
	basePath: BASE_URL,
	async redirects() {
		return [
			// This is pretty much just for the local dev experience
			// Will redirect localhost:3000 to localhost:3000/ark.env
			// To support our basePath
			{
				source: "/",
				destination: BASE_URL,
				permanent: true,
				basePath: false,
			},
		];
	},
});
