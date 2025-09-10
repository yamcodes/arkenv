import { loader } from "fumadocs-core/source";
import { icons } from "lucide-react";
import { createElement } from "react";
import { docs } from "~/.source";

function createNewElement() {
	return createElement(
		"span",
		{
			className:
				"bg-gradient-to-r from-yellow-400 to-yellow-100 text-amber-800 px-1.5 py-0.5 rounded text-xs font-medium",
			"data-new": "true",
		},
		"New!",
	);
}

export const source = loader({
	baseUrl: "/docs",
	source: docs.toFumadocsSource(),
	icon(icon) {
		if (!icon) {
			// You may set a default icon
			return;
		}

		if (icon === "New") return createNewElement();

		if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
	},
});
