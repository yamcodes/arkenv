import type { autocomplete } from "@ark/util";
import { loader } from "fumadocs-core/source";
import { icons } from "lucide-react";
import { createElement } from "react";
import { docs } from "~/.source";
import { Badge } from "~/components/ui/badge";

// function createNewElement() {
// 	return createElement(
// 		"span",
// 		{
// 			className:
// 				"bg-gradient-to-r from-yellow-400 to-yellow-100 text-amber-800 px-1.5 py-0.5 rounded text-xs font-medium",
// 			"data-new": "true",
// 		},
// 		"New",
// 	);
// }
export type IconName = keyof typeof icons | "New";

export const source = loader({
	baseUrl: "/docs",
	source: docs.toFumadocsSource(),
	icon(icon?: autocomplete<IconName>) {
		if (!icon) return;

		if (icon in icons) return createElement(icons[icon as never]);
		if (icon === "New")
			return (
				<Badge
					className="h-4 text-[10px] px-[0.2rem] order-2"
				>
					new
				</Badge>
			);

		throw new Error(`${icon} is not a valid icon`);
	},
});
