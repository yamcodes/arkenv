import {
	Card as CardComponent,
	type CardProps,
} from "fumadocs-ui/components/card";

export function Card(props: CardProps) {
	return <CardComponent {...props} className="[&>p:last-child]:mb-0" />;
}
