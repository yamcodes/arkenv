import { BASE_PATH } from "@/constants";
import { createMDX } from "fumadocs-mdx/next";

export default createMDX()({
	reactStrictMode: true,
	basePath: BASE_PATH,
});
