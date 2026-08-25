"use client";

import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui";
import type { HeroMvpHostId, HeroMvpValidatorId } from "./hero-mvp-snippets";
import { useHeroPlayground } from "./hero-playground";

export type HeroEnvHoverHtml = {
	host: HeroMvpHostId;
	validator: HeroMvpValidatorId;
	html: string;
};

type HeroEnvHoverProps = {
	hovers: HeroEnvHoverHtml[];
};

/**
 * Twoslash hover on the slogan `env`, using the same themed popup HTML as the
 * example snippet for the active validator.
 */
export function HeroEnvHover({ hovers }: HeroEnvHoverProps) {
	const { validator } = useHeroPlayground();
	const current =
		hovers.find(
			(item) => item.host === "vanilla" && item.validator === validator,
		) ??
		hovers.find((item) => item.validator === validator) ??
		hovers[0];

	if (!current) {
		return <code>env</code>;
	}

	return (
		<span className="twoslash">
			<Popup delay={180}>
				<PopupTrigger aria-label="Example type of env">
					<code>env</code>
				</PopupTrigger>
				<PopupContent
					className="home-aurora__env-hover"
					side="bottom"
					align="start"
				>
					<div
						className="home-aurora__env-hover-code"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: static Twoslash HTML from server
						dangerouslySetInnerHTML={{ __html: current.html }}
					/>
				</PopupContent>
			</Popup>
		</span>
	);
}
