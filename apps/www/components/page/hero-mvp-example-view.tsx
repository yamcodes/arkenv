"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { HeroMvpValidatorMark } from "./hero-mvp-marks";
import {
	HERO_MVP_VALIDATORS,
	type HeroMvpHostId,
	type HeroMvpValidatorId,
} from "./hero-mvp-snippets";
import { useHeroPlayground } from "./hero-playground";
import { HeroTwoslashHtml } from "./hero-twoslash-html";
import { WindowChrome } from "./window-chrome";

export type HeroMvpExample = {
	host: HeroMvpHostId;
	validator: HeroMvpValidatorId;
	importLine: string;
	html: string;
};

type HeroMvpExampleViewProps = {
	examples: HeroMvpExample[];
};

type TabInk = {
	x: number;
	y: number;
	width: number;
	ready: boolean;
};

function useTabInk(validator: HeroMvpValidatorId) {
	const listRef = useRef<HTMLDivElement>(null);
	const [ink, setInk] = useState<TabInk>({
		x: 0,
		y: 0,
		width: 0,
		ready: false,
	});

	useLayoutEffect(() => {
		const list = listRef.current;
		if (!list) return;

		const update = () => {
			const active = list.querySelector<HTMLElement>(
				`[id$="-validator-${validator}"]`,
			);
			if (!active) return;
			setInk({
				x: active.offsetLeft,
				y: active.offsetTop + active.offsetHeight - 2,
				width: active.offsetWidth,
				ready: true,
			});
		};

		update();
		if (typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(update);
		observer.observe(list);
		return () => observer.disconnect();
	}, [validator]);

	return { listRef, ink };
}

/**
 * Validator tabs over a vanilla env.ts window. Hosts live in the ticker, not here.
 */
export function HeroMvpExampleView({ examples }: HeroMvpExampleViewProps) {
	const { validator, setValidator } = useHeroPlayground();
	const { listRef, ink } = useTabInk(validator);
	const baseId = useId();
	const panes = examples.filter((item) => item.host === "vanilla");
	if (panes.length === 0) return null;
	const panelId = `${baseId}-panel`;
	const validatorTabId = `${baseId}-validator-${validator}`;

	return (
		<div className="home-aurora__mvp">
			<div className="home-aurora__mvp-validators" ref={listRef}>
				<div
					className="home-aurora__mvp-validators-list"
					role="tablist"
					aria-label="Validator"
				>
					{HERO_MVP_VALIDATORS.map((item) => (
						<button
							key={item.id}
							type="button"
							role="tab"
							id={`${baseId}-validator-${item.id}`}
							aria-selected={validator === item.id}
							aria-controls={panelId}
							tabIndex={validator === item.id ? 0 : -1}
							className="home-aurora__mvp-tab"
							data-active={validator === item.id ? "true" : undefined}
							onClick={() => setValidator(item.id)}
						>
							<HeroMvpValidatorMark id={item.id} />
							{item.label}
						</button>
					))}
				</div>
				<span
					className="home-aurora__mvp-tab-ink"
					aria-hidden="true"
					data-ready={ink.ready ? "true" : undefined}
					style={{
						width: `${ink.width}px`,
						transform: `translate(${ink.x}px, ${ink.y}px)`,
					}}
				/>
			</div>

			<figure className="home-aurora__mvp-frame">
				<WindowChrome title="./env.ts" />
				<div
					role="tabpanel"
					id={panelId}
					aria-labelledby={validatorTabId}
					className="home-aurora__mvp-body"
				>
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
