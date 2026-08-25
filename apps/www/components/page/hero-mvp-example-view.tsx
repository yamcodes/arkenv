"use client";

import { useId } from "react";
import { HeroMvpValidatorMark } from "./hero-mvp-marks";
import {
	HERO_MVP_VALIDATORS,
	type HeroMvpHostId,
	type HeroMvpValidatorId,
} from "./hero-mvp-snippets";
import { useHeroPlayground } from "./hero-playground";
import { HeroTwoslashHtml } from "./hero-twoslash-html";
import { InkTabList } from "./ink-tabs";
import { WindowChrome } from "./window-chrome";

export type HeroMvpExample = {
	host: HeroMvpHostId;
	validator: HeroMvpValidatorId;
	importLine: string;
	html: string;
	code: string;
};

type HeroMvpExampleViewProps = {
	examples: HeroMvpExample[];
};

/**
 * Validator tabs over a vanilla env.ts window. Hosts live in the ticker, not here.
 */
export function HeroMvpExampleView({ examples }: HeroMvpExampleViewProps) {
	const { validator, setValidator } = useHeroPlayground();
	const baseId = useId();
	const panes = examples.filter((item) => item.host === "vanilla");
	if (panes.length === 0) return null;
	const panelId = `${baseId}-panel`;
	const active = panes.find((item) => item.validator === validator) ?? panes[0];

	return (
		<div className="home-aurora__mvp">
			<InkTabList
				label="Validator"
				value={validator}
				controls={panelId}
				onChange={setValidator}
				items={HERO_MVP_VALIDATORS.map((item) => ({
					id: item.id,
					label: (
						<>
							<HeroMvpValidatorMark id={item.id} />
							{item.label}
						</>
					),
				}))}
			/>

			<figure className="home-aurora__code-window home-aurora__mvp-frame">
				<WindowChrome title="./env.ts" copyText={active.code} />
				<div role="tabpanel" id={panelId} className="home-aurora__mvp-body">
					{panes.map((item) => {
						const active = item.validator === validator;
						return (
							<div
								key={`${item.host}-${item.validator}`}
								className="home-aurora__mvp-pane"
								data-active={active ? "true" : undefined}
								aria-hidden={active ? undefined : true}
								{...(!active ? { inert: true } : {})}
							>
								<HeroTwoslashHtml html={item.html} active={active} />
							</div>
						);
					})}
				</div>
			</figure>
		</div>
	);
}
