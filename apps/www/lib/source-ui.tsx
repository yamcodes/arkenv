import type { autocomplete } from "@ark/util";
import { SiBun, SiVite } from "@icons-pack/react-simple-icons";
import { icons } from "lucide-react";
import { createElement } from "react";
import { NewBadge, UpdatedBadge } from "~/components/ui/new-badge";
import { source as baseSource, type IconName } from "./source";

export type { IconName };

/** @ts-ignore - adding icon helper for UI components */
baseSource.icon = (icon?: autocomplete<IconName>) => {
	if (!icon) return;

	if (icon in icons) return createElement(icons[icon as never]);
	if (icon === "New") return <NewBadge className="order-1" />;
	if (icon === "Updated") return <UpdatedBadge className="order-1" />;
	if (icon === "Bun") return createElement(SiBun);
	if (icon === "Vite") return createElement(SiVite);

	throw new Error(`${icon} is not a valid icon`);
};

export const source = baseSource;
