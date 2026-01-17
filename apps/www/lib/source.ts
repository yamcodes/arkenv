import { docs } from "fumadocs-mdx:collections/server";
import { loader } from "fumadocs-core/source";
import type { icons } from "lucide-react";

export type IconName = keyof typeof icons | "New" | "Updated";

export const source = loader({
	baseUrl: "/docs",
	source: docs.toFumadocsSource(),
});
