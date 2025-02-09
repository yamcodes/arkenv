import { createMDX } from "fumadocs-mdx/next";
import { BASE_URL } from "~/config/constants";

export default createMDX()({
	reactStrictMode: true,
	basePath: BASE_URL,
});
