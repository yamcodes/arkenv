import {
	Card as CardComponent,
	type CardProps,
} from "fumadocs-ui/components/card";
import { ArrowUpRight } from "lucide-react";
import { isExternalUrl } from "~/lib/utils/url";

export function Card({ title, ...props }: CardProps) {
	const isExternal = isExternalUrl(props.href);

	const augmentedTitle = isExternal ? (
		<span className="flex items-center gap-0.5">
			{title}
			<ArrowUpRight className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
		</span>
	) : (
		title
	);

	return (
		<CardComponent
			{...props}
			title={augmentedTitle}
			data-card
			data-external-link={isExternal || undefined}
			className="[&>p:last-child]:mb-0"
		/>
	);
}
