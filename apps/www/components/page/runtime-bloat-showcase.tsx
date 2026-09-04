"use client";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";

const HOST_MESSAGE = 'must be a string or "localhost" (was missing)';
const PORT_MESSAGE = "must be a number (was a string)";

function EllipsisMessage({ message }: { message: string }) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="home-aurora__json-ellipsis"
					aria-label={`Full message: ${message}`}
				>
					…
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				side="top"
				collisionPadding={12}
				className="home-aurora__json-ellipsis-tip min-w-0 max-w-[min(18rem,calc(100vw-1.5rem))] rounded-md border-fd-border bg-fd-popover p-2 text-xs leading-snug text-fd-popover-foreground shadow-md backdrop-blur-none"
			>
				{message}
			</PopoverContent>
		</Popover>
	);
}

/**
 * Machine-readable validation errors for CI and agents.
 */
export function RuntimeBloatShowcase() {
	return (
		<section
			className="home-aurora__pitch"
			aria-labelledby="home-errors"
			id="errors"
		>
			<header className="home-aurora__pitch-head">
				<h2 id="home-errors" data-reveal="blur">
					Structured errors
				</h2>
				<p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
					Each issue gets a code that agents and CI can act on. Missing keys and
					bad values aren&apos;t the same.
				</p>
			</header>

			<figure
				className="home-aurora__pitch-visual home-aurora__code-window home-aurora__json"
				data-reveal
				style={{ ["--reveal-delay" as string]: "140ms" }}
				aria-label="JSON issues for HOST missing and PORT invalid type"
			>
				<span className="home-aurora__json-lang" aria-hidden="true">
					json
				</span>
				<pre className="home-aurora__json-body home-aurora__tty--wrap">
					<code>
						{
							'{\n  "success": false,\n  "issues": [\n    {\n      "path": "HOST",\n      "code": "MISSING_VARIABLE",\n      "message": "'
						}
						<EllipsisMessage message={HOST_MESSAGE} />
						{
							'"\n    },\n    {\n      "path": "PORT",\n      "code": "INVALID_TYPE",\n      "message": "'
						}
						<EllipsisMessage message={PORT_MESSAGE} />
						{'"\n    }\n  ]\n}'}
					</code>
				</pre>
			</figure>
		</section>
	);
}
