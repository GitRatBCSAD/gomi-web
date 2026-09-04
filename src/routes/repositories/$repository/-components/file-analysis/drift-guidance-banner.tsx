import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import type { JSX } from "react";

import type { FileRiskResult } from "@/lib/github/model";

import { computeDrift, type DriftCategory } from "./drift-utils";

const BANNER_STYLE: Record<DriftCategory, { bg: string; fg: string; icon: typeof InfoIcon }> = {
	"Accelerating Debt Hotspot": {
		bg: "var(--destructive-900)",
		fg: "var(--destructive-500)",
		icon: TriangleAlertIcon,
	},
	"Developer Frustration Drift": {
		bg: "var(--destructive-900)",
		fg: "var(--destructive-500)",
		icon: TriangleAlertIcon,
	},
	"Refactoring Recovery": {
		bg: "var(--primary-900)",
		fg: "var(--primary-500)",
		icon: InfoIcon,
	},
	"Passive Legacy Debt": {
		bg: "var(--background-800)",
		fg: "var(--text-subtle)",
		icon: InfoIcon,
	},
};

export function DriftGuidanceBanner({ file }: { file: FileRiskResult }): JSX.Element | null {
	if (file.lowConfidence || file.commitSentiments.length < 10) return null;

	const drift = computeDrift(file.commitSentiments, file.shapBreakdown);
	if (!drift) return null;

	const { bg, fg, icon: Icon } = BANNER_STYLE[drift.category];

	return (
		<div
			className="flex items-start gap-2.5 rounded-lg p-3"
			style={{ backgroundColor: bg, color: fg }}
		>
			<Icon className="mt-0.5 size-4 shrink-0" />
			<p className="font-fira-mono text-xs leading-relaxed">
				<span className="font-fira-mono-bold">{drift.category}</span> — {drift.guidanceText}
			</p>
		</div>
	);
}
