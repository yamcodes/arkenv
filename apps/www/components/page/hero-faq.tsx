"use client";

import { useCallback, useEffect, useId, useState } from "react";

/**
 * Homepage FAQ picks shown on the landing page.
 * Keep answers as short teasers; long items may link out with `continueHref`.
 */
const FAQ: readonly {
	id: string;
	question: React.ReactNode;
	teaser: React.ReactNode;
	/**
	 * Optional deep link when the teaser is truncated.
	 */
	continueHref?: string;
}[] = [
	{
		id: "why",
		question: "Why do I need ArkEnv?",
		teaser: (
			<>
				<p>
					When environment variables fail, the results can be silent,
					unexpected, and catastrophic. CI deployments miss required keys,
					stringified booleans like <code>&quot;false&quot;</code> evaluate as
					truthy, and schema updates break downstream code.
				</p>
				<p>
					ArkEnv protects against this by validating the environment against
					your schema before a single line of code runs.
				</p>
			</>
		),
	},
	{
		id: "env-files",
		question: (
			<>
				Does ArkEnv load my <code>.env</code> files?
			</>
		),
		teaser: (
			<>
				No. ArkEnv validates the env your framework already loaded. It does not
				read <code>.env</code> files itself.
			</>
		),
	},
	{
		id: "arktype",
		question: "Do I have to use ArkType?",
		teaser:
			"No. Use any Standard Schema validator: Zod, Valibot, Typia, and others.",
	},
	{
		id: "zod",
		question: "Does ArkEnv work with Zod?",
		teaser:
			"Yes. Zod has a first-class example, and the CLI can scaffold ArkEnv + Zod for you.",
	},
	{
		id: "agents",
		question:
			"Does ArkEnv support AI development tools like Claude Code or Cursor?",
		teaser: (
			<>
				Yes. Point the agent skill at your <code>.env.example</code> to
				intelligently set up validation and guide your assistant through schema
				maintenance.
			</>
		),
	},
];

/**
 * Landing FAQ accordion.
 * `#why` expands the first item and scrolls to the section.
 */
export function HeroFaq() {
	const [openId, setOpenId] = useState<string | null>(null);
	const baseId = useId();

	const openWhy = useCallback(() => {
		if (window.location.hash !== "#why" && window.location.hash !== "#faq") {
			return;
		}
		if (window.location.hash === "#why") {
			setOpenId("why");
		}
		requestAnimationFrame(() => {
			const target =
				window.location.hash === "#why"
					? document.getElementById("why")
					: document.getElementById("faq");
			target?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		});
	}, []);

	useEffect(() => {
		openWhy();
		window.addEventListener("hashchange", openWhy);

		const onClick = (event: MouseEvent) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			const link = target.closest(
				'a[href="/#why"], a[href="#why"], a[href="/#faq"], a[href="#faq"]',
			);
			if (!link) return;
			requestAnimationFrame(openWhy);
		};
		document.addEventListener("click", onClick);

		return () => {
			window.removeEventListener("hashchange", openWhy);
			document.removeEventListener("click", onClick);
		};
	}, [openWhy]);

	return (
		<section
			id="faq"
			className="home-aurora__faq-section"
			aria-labelledby="home-faq"
		>
			<header className="home-aurora__faq-head">
				<h2 id="home-faq" data-reveal="blur">
					Frequently asked questions.
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Common questions about validating environment variables with ArkEnv.
				</p>
			</header>

			<div
				className="home-aurora__faq"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
			>
				{FAQ.map((item) => {
					const isOpen = openId === item.id;
					const panelId = `${baseId}-${item.id}-panel`;
					const buttonId = `${baseId}-${item.id}-button`;

					return (
						<div
							key={item.id}
							id={item.id}
							className="home-aurora__faq-item"
							data-open={isOpen ? "true" : undefined}
						>
							<button
								type="button"
								id={buttonId}
								className="home-aurora__faq-trigger"
								aria-expanded={isOpen}
								aria-controls={panelId}
								onClick={() => setOpenId(isOpen ? null : item.id)}
							>
								<span>{item.question}</span>
								<span className="home-aurora__faq-icon" aria-hidden="true">
									<span className="home-aurora__faq-icon-h" />
									<span className="home-aurora__faq-icon-v" />
								</span>
							</button>
							{/* biome-ignore lint/a11y/useSemanticElements: accordion panel region */}
							<div
								id={panelId}
								role="region"
								aria-labelledby={buttonId}
								className="home-aurora__faq-panel"
								inert={!isOpen ? true : undefined}
							>
								<div className="home-aurora__faq-panel-inner">
									<p>{item.teaser}</p>
									{item.continueHref ? (
										<p className="home-aurora__faq-more">
											<a href={item.continueHref}>Continue in the FAQ →</a>
										</p>
									) : null}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}
