import {
	Branches,
	CommitActivityLine,
	ContributorsStats,
	Gitmap,
	OrgBadge,
	PullRequests,
	RepoBadge,
	Status,
	TrafficClonesHistogram,
	TrafficViewsHistogram,
	UserBadge,
} from "@getdashfy/ext-github";
import { CustomJson, JsonKeys, JsonStatus } from "@getdashfy/ext-json";
import { Dashfy, WidgetRegistry } from "@getdashfy/ui";

WidgetRegistry.addExtension("github", {
	Branches,
	CommitActivityLine,
	ContributorsStats,
	Gitmap,
	OrgBadge,
	PullRequests,
	RepoBadge,
	Status,
	TrafficClonesHistogram,
	TrafficViewsHistogram,
	UserBadge,
});

WidgetRegistry.addExtension("json", {
	CustomJson,
	JsonKeys,
	JsonStatus,
});

export const App = () => <Dashfy serverUrl={window.location.origin} />;
