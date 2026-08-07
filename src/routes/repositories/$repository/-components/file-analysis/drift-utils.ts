import type { CommitSentiment, ShapBreakdown } from "@/lib/github/model";

const EWMA_ALPHA = 0.2;

export type DriftCategory =
	| "Developer Frustration Drift"
	| "Accelerating Debt Hotspot"
	| "Refactoring Recovery"
	| "Passive Legacy Debt";

export type DriftResult = {
	category: DriftCategory;
	hasSpike: boolean;
	spikeDirection: "up" | "down" | null;
	isAffective: boolean;
	rootCauseCommit: CommitSentiment | null;
	guidanceText: string;
};

export function computeDrift(
	commits: CommitSentiment[],
	shap: ShapBreakdown | null,
): DriftResult | null {
	const sorted = [...commits]
		.filter((c) => c.riskProbability != null)
		.sort((a, b) => a.committedAt - b.committedAt);

	if (sorted.length < 10) return null;

	const values = sorted.map((c) => c.riskProbability as number);

	// Global σ over the commit sequence
	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	const sigma = Math.sqrt(
		values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length,
	);

	// EWMA spike detection — α = 0.2
	let ewma = values[0];
	let maxUpDev = 0;
	let maxDownDev = 0;
	let upIdx = -1;
	let downIdx = -1;

	for (let i = 1; i < values.length; i++) {
		const prevEwma = ewma;
		ewma = EWMA_ALPHA * values[i] + (1 - EWMA_ALPHA) * ewma;
		const upDev = values[i] - prevEwma;
		const downDev = prevEwma - values[i];
		if (upDev > 2 * sigma && upDev > maxUpDev) {
			maxUpDev = upDev;
			upIdx = i;
		}
		if (downDev > 2 * sigma && downDev > maxDownDev) {
			maxDownDev = downDev;
			downIdx = i;
		}
	}

	const hasSpike = upIdx >= 0 || downIdx >= 0;
	const spikeDirection: "up" | "down" | null =
		upIdx >= 0 && maxUpDev >= maxDownDev ? "up" : downIdx >= 0 ? "down" : null;

	// Root cause = commit with max deviation in the spike direction
	const rootCauseCommit = !hasSpike
		? null
		: spikeDirection === "up"
			? sorted[upIdx]
			: sorted[downIdx];

	// SHAP group dominance
	const affectiveSum =
		(shap?.sentimentContrib ?? 0) + Math.max(0, shap?.lowInfoContrib ?? 0);
	const structuralSum =
		(shap?.entropyContrib ?? 0) +
		(shap?.ndevContrib ?? 0) +
		(shap?.ageContrib ?? 0) +
		(shap?.complexityContrib ?? 0) +
		(shap?.commitsContrib ?? 0);
	const isAffective = affectiveSum > structuralSum;

	// Drift categorization matrix per §4
	let category: DriftCategory;
	let guidanceText: string;

	if (hasSpike && spikeDirection === "up") {
		if (isAffective) {
			category = "Developer Frustration Drift";
			guidanceText =
				"Developer sentiment is declining without much structural change. Check for unclear specs, repeated rework, or ownership issues.";
		} else {
			category = "Accelerating Debt Hotspot";
			guidanceText =
				"This file is degrading quickly. Review recent commits before the next sprint to prevent further damage.";
		}
	} else if (hasSpike && spikeDirection === "down") {
		category = "Refactoring Recovery";
		guidanceText =
			"Cleanup is working and risk is dropping. Keep the current approach going.";
	} else {
		if (isAffective) {
			category = "Developer Frustration Drift";
			guidanceText =
				"Developers are struggling with this file despite no structural changes. Look into confusion or ownership gaps.";
		} else {
			category = "Passive Legacy Debt";
			guidanceText =
				"Complex but stable legacy file with no active degradation. Keep it in the routine maintenance queue.";
		}
	}

	return { category, hasSpike, spikeDirection, isAffective, rootCauseCommit, guidanceText };
}
