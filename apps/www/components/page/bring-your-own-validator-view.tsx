"use client";

import { useId, useState } from "react";
import { ValidatorMark } from "./hero-mvp-marks";
import { HeroTwoslashHtml } from "./hero-twoslash-html";
import { InkTabList } from "./ink-tabs";
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
				<h2 id="home-modular" data-reveal="blur">
					Keep your existing validator.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Pass the ArkType, Zod, or Valibot schemas you already have.{" "}
					<a href="/docs/core-concepts/standard-schema">Standard Schema</a> gives
					you the same <code>env</code> API.
				</p>
			</header>

			<div
				className="home-aurora__validator"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				<InkTabList
					label="Validator examples"
					value={active}
					controls={panelId}
					onChange={setActive}
					items={examples.map((item) => ({
						id: item.id,
						label: (
							<>
								<ValidatorMark id={item.id} />
								{item.label}
							</>
						),
					}))}
				/>

				<figure className="home-aurora__code-window">
					<WindowChrome title="./env.ts" />
					<div
						role="tabpanel"
						id={panelId}
						className="home-aurora__validator-body"
						key={example.id}
					>
						<HeroTwoslashHtml
							html={example.html}
							active
							className="home-aurora__shiki"
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
