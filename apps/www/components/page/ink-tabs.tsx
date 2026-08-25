"use client";

import {
	type ReactNode,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

type InkTab<Id extends string> = {
	id: Id;
	label: ReactNode;
};

type TabInk = {
	x: number;
	y: number;
	width: number;
	ready: boolean;
};

function useTabInk(value: string) {
	const listRef = useRef<HTMLDivElement>(null);
	const [ink, setInk] = useState<TabInk>({
		x: 0,
		y: 0,
		width: 0,
		ready: false,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: value remeasures the ink under the selected tab
	useLayoutEffect(() => {
		const list = listRef.current;
		if (!list) return;

		const update = () => {
			const active = list.querySelector<HTMLElement>(
				'[role="tab"][aria-selected="true"]',
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
	}, [value]);

	return { listRef, ink };
}

type InkTabListProps<Id extends string> = {
	label: string;
	value: Id;
	items: readonly InkTab<Id>[];
	controls: string;
	onChange: (id: Id) => void;
	className?: string;
};

/**
 * Sliding-ink tablist used on the homepage (hero, Modular).
 */
export function InkTabList<Id extends string>({
	label,
	value,
	items,
	controls,
	onChange,
	className,
}: InkTabListProps<Id>) {
	const { listRef, ink } = useTabInk(value);
	const baseId = useId();

	return (
		<div
			className={["home-aurora__tabs", className].filter(Boolean).join(" ")}
			ref={listRef}
		>
			<div className="home-aurora__tabs-list" role="tablist" aria-label={label}>
				{items.map((item) => (
					<button
						key={item.id}
						type="button"
						role="tab"
						id={`${baseId}-tab-${item.id}`}
						aria-selected={value === item.id}
						aria-controls={controls}
						tabIndex={value === item.id ? 0 : -1}
						className="home-aurora__tab"
						data-active={value === item.id ? "true" : undefined}
						onClick={() => onChange(item.id)}
					>
						{item.label}
					</button>
				))}
			</div>
			<span
				className="home-aurora__tab-ink"
				aria-hidden="true"
				data-ready={ink.ready ? "true" : undefined}
				style={{
					width: `${ink.width}px`,
					transform: `translate(${ink.x}px, ${ink.y}px)`,
				}}
			/>
		</div>
	);
}
