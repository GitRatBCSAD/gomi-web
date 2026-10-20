import type { CommitSentiment, ShapBreakdown } from "@/lib/github/model";
import { MIN_TREND_POINTS, readableCommits, toneVsStructure } from "@/lib/interpret";

// NIST/SEMATECH e-Handbook 6.3.2.4: lambda is usually set between 0.2 and 0.3.
const EWMA_ALPHA = 0.2;
// NIST/SEMATECH e-Handbook: control limits at k = 3.
const EWMA_K = 3;

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
	const sorted = readableCommits(commits);

	if (sorted.length < MIN_TREND_POINTS) return null;

	const values = sorted.map((c) => c.riskProbability as number);

	// One-step-ahead EWMA forecast errors (exponential smoothing as a forecast, NIST/SEMATECH
	// e-Handbook 6.4.3.1), checked with individuals-chart limits (6.3.2.2): ±k·σ with k = 3
	// and σ = average moving range / 1.128, which a single shift barely inflates.
	const errors: number[] = [];
	let ewma = values[0];
	for (let i = 1; i < values.length; i++) {
		errors.push(values[i] - ewma);
		ewma = EWMA_ALPHA * values[i] + (1 - EWMA_ALPHA) * ewma;
	}
	let mrSum = 0;
	for (let i = 1; i < errors.length; i++) mrSum += Math.abs(errors[i] - errors[i - 1]);
	const limit = EWMA_K * (mrSum / (errors.length - 1) / 1.128);

	let maxUpDev = 0;
	let maxDownDev = 0;
	let upIdx = -1;
	let downIdx = -1;
	errors.forEach((e, k) => {
		const i = k + 1; // errors[k] belongs to commit i
		if (e > limit && e > maxUpDev) {
			maxUpDev = e;
			upIdx = i;
		}
		if (-e > limit && -e > maxDownDev) {
			maxDownDev = -e;
			downIdx = i;
		}
	});

	const hasSpike = upIdx >= 0 || downIdx >= 0;
	const spikeDirection: "up" | "down" | null =
		upIdx >= 0 && maxUpDev >= maxDownDev ? "up" : downIdx >= 0 ? "down" : null;

	// Root cause = commit with max deviation in the spike direction
	const rootCauseCommit = !hasSpike
		? null
		: spikeDirection === "up"
			? sorted[upIdx]
			: sorted[downIdx];

	// SHAP group dominance (|SHAP|, same split as the root-cause card)
	const { tone, structure } = toneVsStructure(shap);
	const isAffective = tone > structure;

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
		guidanceText = "Cleanup is working and risk is dropping. Keep the current approach going.";
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
