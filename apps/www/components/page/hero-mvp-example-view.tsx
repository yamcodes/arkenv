"use client";

import { useId, useLayoutEffect, useRef } from "react";
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

type ScrollEdgeFades = {
	overflow: boolean;
	fadeTop: boolean;
	fadeBottom: boolean;
};

function readScrollEdgeFades(scroll: HTMLElement): ScrollEdgeFades {
	const canScroll = scroll.scrollHeight > scroll.clientHeight + 1;
	if (!canScroll) {
		return { overflow: false, fadeTop: false, fadeBottom: false };
	}
	const atTop = scroll.scrollTop <= 1;
	const atBottom =
		scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 1;
	return {
		overflow: true,
		fadeTop: !atTop,
		fadeBottom: !atBottom,
	};
}

/**
 * Validator tabs over a vanilla env.ts window. Hosts live in the ticker, not here.
 */
export function HeroMvpExampleView({ examples }: HeroMvpExampleViewProps) {
	const { validator, setValidator } = useHeroPlayground();
	const baseId = useId();
	const bodyRef = useRef<HTMLDivElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const panes = examples.filter((item) => item.host === "vanilla");

	useLayoutEffect(() => {
		const body = bodyRef.current;
		const scroll = scrollRef.current;
		if (!body || !scroll) return;

		const applyFades = () => {
			const edges = readScrollEdgeFades(scroll);
			if (edges.overflow) body.dataset.overflow = "true";
			else delete body.dataset.overflow;
			if (edges.fadeTop) body.dataset.fadeTop = "true";
			else delete body.dataset.fadeTop;
			if (edges.fadeBottom) body.dataset.fadeBottom = "true";
			else delete body.dataset.fadeBottom;
		};

		// Re-run when the active pane swaps so scroll position and fades reset.
		void validator;
		scroll.scrollTop = 0;
		applyFades();
		scroll.addEventListener("scroll", applyFades, { passive: true });
		const ro = new ResizeObserver(applyFades);
		ro.observe(scroll);
		for (const child of scroll.children) {
			if (child instanceof HTMLElement) ro.observe(child);
		}
		return () => {
			scroll.removeEventListener("scroll", applyFades);
			ro.disconnect();
		};
	}, [validator]);

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
				<div
					ref={bodyRef}
					role="tabpanel"
					id={panelId}
					className="home-aurora__mvp-body"
				>
					<div ref={scrollRef} className="home-aurora__mvp-scroll">
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
				</div>
			</figure>
		</div>
	);
}
