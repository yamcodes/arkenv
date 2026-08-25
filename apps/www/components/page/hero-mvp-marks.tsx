import { SiZod } from "@icons-pack/react-simple-icons";
import type { ReactNode } from "react";
import { ArkTypeIcon } from "~/components/icons/arktype-icon";
import { ValibotIcon } from "~/components/icons/valibot-icon";
import type { HeroMvpValidatorId } from "./hero-mvp-snippets";

const iconClass = "home-aurora__tab-icon";

function Mark({ children }: { children: ReactNode }) {
	return (
		<span className="home-aurora__tab-mark" aria-hidden="true">
			{children}
		</span>
	);
}

export type ValidatorMarkId = HeroMvpValidatorId | "valibot";

/**
 * Monotone validator mark for homepage ink tabs.
 */
export function ValidatorMark({ id }: { id: ValidatorMarkId }) {
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
		case "valibot":
			return (
				<Mark>
					<ValibotIcon className={iconClass} width="1em" height="1em" />
				</Mark>
			);
	}
}

export function HeroMvpValidatorMark({ id }: { id: HeroMvpValidatorId }) {
	return <ValidatorMark id={id} />;
}
