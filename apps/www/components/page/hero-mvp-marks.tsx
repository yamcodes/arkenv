import { SiZod } from "@icons-pack/react-simple-icons";
import type { ReactNode } from "react";
import { ArkTypeIcon } from "~/components/icons/arktype-icon";
import type { HeroMvpValidatorId } from "./hero-mvp-snippets";

const iconClass = "home-aurora__mvp-tab-icon";

function Mark({ children }: { children: ReactNode }) {
	return (
		<span className="home-aurora__mvp-tab-mark" aria-hidden="true">
			{children}
		</span>
	);
}

export function HeroMvpValidatorMark({ id }: { id: HeroMvpValidatorId }) {
	switch (id) {
		case "arktype":
			return (
				<Mark>
					<ArkTypeIcon
						className={iconClass}
						variant="monotone"
						width="1em"
						height="1em"
					/>
				</Mark>
			);
		case "zod":
			return (
				<Mark>
					<SiZod className={iconClass} size={14} />
				</Mark>
			);
	}
}
