"use client";

import { useId, useState } from "react";
import { WindowChrome } from "./window-chrome";

type ValidatorExample = {
	id: "arktype" | "zod" | "valibot";
	label: string;
	importLine: string;
	html: string;
};

type BringYourOwnValidatorViewProps = {
	examples: ValidatorExample[];
};

/**
 * Client tabs over server-highlighted validator snippets.
 */
export function BringYourOwnValidatorView({
	examples,
}: BringYourOwnValidatorViewProps) {
	const [active, setActive] = useState<ValidatorExample["id"]>("arktype");
	const baseId = useId();
	const example = examples.find((item) => item.id === active) ?? examples[0];
	const panelId = `${baseId}-panel`;

	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-modular"
			id="modular"
		>
			<header className="home-aurora__pitch-head">
				<p className="home-aurora__pitch-label" data-reveal="fade">
					04 / MODULAR
				</p>
				<h2 id="home-modular" data-reveal="blur">
					Bring your own validator.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Use ArkType, Zod, Valibot, or any{" "}
					<a href="/docs/core-concepts/standard-schema">
						Standard Schema
					</a>{" "}
					library. Either way, you get the same <code>env</code> API.
				</p>
			</header>

			<div
				className="home-aurora__validator"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				<div
					className="home-aurora__validator-tabs"
					role="tablist"
					aria-label="Validator examples"
				>
					{examples.map((item) => (
						<button
							key={item.id}
							type="button"
							role="tab"
							id={`${baseId}-tab-${item.id}`}
							aria-selected={active === item.id}
							aria-controls={panelId}
							tabIndex={active === item.id ? 0 : -1}
							className="home-aurora__validator-tab"
							data-active={active === item.id ? "true" : undefined}
							onClick={() => setActive(item.id)}
						>
							{item.label}
						</button>
					))}
				</div>

				<figure className="home-aurora__validator-frame">
					<WindowChrome title="env.ts" />
					<div
						role="tabpanel"
						id={panelId}
						aria-labelledby={`${baseId}-tab-${example.id}`}
						className="home-aurora__validator-body"
						key={example.id}
					>
						<div
							className="home-aurora__shiki"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: static Shiki HTML from server
							dangerouslySetInnerHTML={{ __html: example.html }}
						/>
					</div>
				</figure>

				<p className="home-aurora__validator-note">
					<span className="home-aurora__tok-muted">via</span>{" "}
					<code>{example.importLine}</code>
					{" · "}
					<a href="/docs/core-concepts/standard-schema">
						See Standard Schema docs →
					</a>
				</p>
			</div>
		</section>
	);
}
