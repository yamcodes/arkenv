import { docs } from "fumadocs-mdx:collections/server";
import type { autocomplete } from "@ark/util";
import * as SimpleIcons from "@icons-pack/react-simple-icons";
import { loader } from "fumadocs-core/source";
import { icons } from "lucide-react";
import { createElement } from "react";
import { NewBadge, UpdatedBadge } from "~/components/ui/new-badge";

export type IconName = keyof typeof icons | "New" | "Updated";

export const source = loader({
	baseUrl: "/docs",
	source: docs.toFumadocsSource(),
	icon(icon?: autocomplete<IconName>) {
		if (!icon) return;

		if (icon in icons) return createElement(icons[icon as never]);
		if (`Si${icon}` in SimpleIcons)
			// biome-ignore lint/performance/noDynamicNamespaceImportAccess: I don't care about bundle size
			return createElement(SimpleIcons[`Si${icon}` as never]);
		if (icon === "New") return <NewBadge className="order-1" />;
		if (icon === "Updated") return <UpdatedBadge className="order-1" />;

		throw new Error(`${icon} is not a valid icon`);
	},
});
