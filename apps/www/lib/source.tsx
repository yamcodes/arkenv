import type { autocomplete } from "@ark/util";
import { loader } from "fumadocs-core/source";
import { icons } from "lucide-react";
import { createElement } from "react";
import { docs } from "~/.source";
import { Badge } from "~/components/ui/badge";

export type IconName = keyof typeof icons | "New";

export const source = loader({
	baseUrl: "/docs",
	source: docs.toFumadocsSource(),
	icon(icon?: autocomplete<IconName>) {
		if (!icon) return;

		if (icon in icons) return createElement(icons[icon as never]);
		if (icon === "New")
			return <Badge className="h-4 text-[10px] px-[0.2rem] order-1">new</Badge>;

		throw new Error(`${icon} is not a valid icon`);
	},
});
