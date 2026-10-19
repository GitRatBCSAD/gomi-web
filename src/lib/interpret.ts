// Verbal interpretation of model outputs. Single source of truth for every
// label shown in the UI; the same rules are documented in Chapter 3
// (references/CHAPTER3_VERBAL_INTERPRETATION.md). Change both together.

import type { CommitSentiment, FileRiskResult, ShapBreakdown } from "./github/model";

// Files with fewer window commits than this are not scored. UI text only: the
// microservice reads the real gate from risk_threshold.json "min_commits".
export const MIN_COMMITS = 1;

/** The commit gate in words: with a gate of 1, unscored files had no changes. */
export const BELOW_GATE = MIN_COMMITS <= 1 ? "no changes" : `fewer than ${MIN_COMMITS} changes`;

export type RiskBand = "low" | "moderate" | "high" | "very-high" | "insufficient";

export type RiskBandInfo = {
	band: RiskBand;
	label: string;
	meaning: string;
	action: string;
	fg: string;
	bg: string;
	fill: string;
	onFill: string;
};

export const RISK_BANDS: Record<RiskBand, RiskBandInfo> = {
	"very-high": {
		band: "very-high",
		label: "Very High",
		meaning:
			"Above the model's warning line and among the riskiest 20% of files in this repository.",
		action: "Review this file before the next change and add tests or refactor.",
		fg: "var(--risk-very-high-ink)",
		bg: "var(--risk-very-high-tint)",
		fill: "var(--risk-very-high-fill)",
		onFill: "var(--risk-very-high-text)",
	},
	high: {
		band: "high",
		label: "High",
		meaning: "Above the model's warning line.",
		action: "Give changes here an extra review and consider adding tests.",
		fg: "var(--risk-high-ink)",
		bg: "var(--risk-high-tint)",
		fill: "var(--risk-high-fill)",
		onFill: "var(--risk-high-text)",
	},
	moderate: {
		band: "moderate",
		label: "Moderate",
		meaning: "Below the model's warning line, but in the riskier half of this repository.",
		action: "Keep an eye on it; no action needed yet.",
		fg: "var(--risk-moderate-ink)",
		bg: "var(--risk-moderate-tint)",
		fill: "var(--risk-moderate-fill)",
		onFill: "var(--risk-moderate-text)",
	},
	low: {
		band: "low",
		label: "Low",
		meaning: "Below the model's warning line and in the safer half of this repository.",
		action: "No action needed.",
		fg: "var(--risk-low-ink)",
		bg: "var(--risk-low-tint)",
		fill: "var(--risk-low-fill)",
		onFill: "var(--risk-low-text)",
	},
	insufficient: {
		band: "insufficient",
		label: "Not enough history",
		meaning: "Too few changes in the analysis window to judge.",
		action: "No score given. Re-check once the file has more history.",
		fg: "var(--risk-none-text)",
		bg: "var(--risk-none-fill)",
		fill: "var(--risk-none-fill)",
		onFill: "var(--risk-none-text)",
	},
};

/** threshold: model warning line; median and top: this repository's median and riskiest-20% cut. */
export type RiskScale = { threshold: number; median: number; top: number };

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

/** SHAP expected value is in log-odds; convert to the model's baseline probability. */
export function baselineFromShap(shap: ShapBreakdown | null | undefined): number | null {
	return shap ? sigmoid(shap.baseRate) : null;
}

// "Very High" = above the warning line and in the riskiest 20% of scored files. 20% is the
// effort-aware convention (Kamei et al., 2013; Guo et al., 2024), which counts 20% of LOC;
// Gomi counts files instead (Chapter 1 limitation 15).
export const TOP_FRACTION = 0.2;

/** Score of the last file inside the top `fraction`; `fallback` when nothing is scored. */
export function topFractionCut(
	scores: number[],
	fallback: number,
	fraction = TOP_FRACTION,
): number {
	if (scores.length === 0) return fallback;
	const sorted = [...scores].sort((a, b) => b - a);
	return sorted[Math.max(1, Math.ceil(fraction * sorted.length)) - 1];
}

/** `threshold` is the model's MCC-optimal operating threshold (risk_threshold.json, served by the API). */
export function riskScale(files: FileRiskResult[], threshold: number): RiskScale {
	const scores = files
		.filter((f) => !f.lowConfidence && f.riskScore != null)
		.map((f) => f.riskScore as number);
	return {
		threshold,
		median: topFractionCut(scores, threshold, 0.5),
		top: topFractionCut(scores, threshold),
	};
}

/**
 * p = predicted probability that the file's 6-month window has a bug-inducing change.
 * Probabilities are not recalibrated, so the bands use the model's warning line plus
 * within-repository ranks (Chapter 3, Table 16).
 * Low      p < threshold and below the repo median
 * Moderate p < threshold and at or above the repo median
 * High     p >= threshold
 * VeryHigh p >= threshold and in the riskiest 20% of this repo
 */
export function riskBand(p: number | null, lowConfidence: boolean, scale: RiskScale): RiskBand {
	if (lowConfidence || p == null) return "insufficient";
	if (p >= scale.threshold) return p >= scale.top ? "very-high" : "high";
	return p >= scale.median ? "moderate" : "low";
}

export const isAtRisk = (b: RiskBand): boolean => b === "high" || b === "very-high";

// --- Percentile-rank features (0-1 within this repository) ---

export function percentileLabel(pct: number): string {
	if (pct >= 0.9) return "Among the highest";
	if (pct >= 0.75) return "Higher than most";
	if (pct >= 0.25) return "Typical";
	return "Lower than most";
}

export type Tone = "bad" | "warn" | "neutral" | "good";

/** For features where higher means riskier. */
export function percentileTone(pct: number): Tone {
	if (pct >= 0.9) return "bad";
	if (pct >= 0.75) return "warn";
	if (pct >= 0.25) return "neutral";
	return "good";
}

// --- Cyclomatic complexity (McCabe, 1976; SEI bands) ---

export function ccnLabel(ccn: number): string {
	if (ccn > 50) return "Very complex, untestable";
	if (ccn > 20) return "Complex, hard to test";
	if (ccn > 10) return "Moderately complex";
	return "Simple";
}

export function ccnTone(ccn: number): Tone {
	if (ccn > 20) return "bad";
	if (ccn > 10) return "warn";
	return "good";
}

// --- Commit tone (DistilBERT argmax label) ---

// F1-optimal p(caution) cutoff for the DistilBERT model (notebook cell 14,
// distilbert_caution_threshold.json). Not the file-risk threshold: that one
// belongs to the logistic regression and must not be drawn on commit charts.
// ponytail: hardcoded; serve it from /threshold if the model is retrained.
export const CAUTION_THRESHOLD = 0.72;

/** Average p(caution) over a set of commits, in words. */
export function worryLevel(p: number): string {
	if (p >= CAUTION_THRESHOLD) return "mostly worried";
	if (p >= 0.5) return "somewhat worried";
	return "mostly calm";
}

export const TONE_LABEL: Record<string, string> = {
	caution: "Worried",
	neutral: "Neutral",
	satisfaction: "Positive",
};

export function toneLabel(code: string | null | undefined): string {
	return code ? (TONE_LABEL[code] ?? code) : "Too short to read";
}

/** Share of commits whose message reads as worried/urgent. */
export function cautionShareLabel(share: number): string {
	if (share >= 0.5) return "Mostly worried";
	if (share >= 0.25) return "Often worried";
	if (share > 0) return "Occasionally worried";
	return "No worried messages";
}

// --- Worry trend (older half vs newer half of readable commits) ---

// Readable (≥5-word) commits needed before a trend, spike or root cause is drawn.
export const MIN_TREND_POINTS = 10;

export type Trend = "up" | "down" | "steady";

export type WorryTrend = {
	earlierAvg: number;
	laterAvg: number;
	pctChange: number;
	trend: Trend;
	headline: string;
	sentence: string;
};

export const TREND_HEADLINE: Record<Trend, string> = {
	up: "Getting more worried",
	down: "Getting calmer",
	steady: "Holding steady",
};

/** Readable commits (p(caution) present), oldest first. */
export function readableCommits(commits: CommitSentiment[]): CommitSentiment[] {
	return commits
		.filter((c) => c.riskProbability != null)
		.sort((a, b) => a.committedAt - b.committedAt);
}

/** Mean p(caution) of the older half vs the newer half, in words. */
export function worryTrend(commits: CommitSentiment[]): WorryTrend | null {
	const ps = readableCommits(commits).map((c) => c.riskProbability as number);
	if (ps.length < 2) return null;
	const mid = Math.floor(ps.length / 2);
	const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
	const earlierAvg = avg(ps.slice(0, mid));
	const laterAvg = avg(ps.slice(mid));
	const pctChange = earlierAvg > 0 ? Math.round(((laterAvg - earlierAvg) / earlierAvg) * 100) : 0;
	// ponytail: ±10% "steady" band is a display convention, documented in Ch. 3
	const trend: Trend = pctChange >= 10 ? "up" : pctChange <= -10 ? "down" : "steady";
	return {
		earlierAvg,
		laterAvg,
		pctChange,
		trend,
		headline: TREND_HEADLINE[trend],
		sentence: `Commit messages went from ${worryLevel(earlierAvg)} in the older half of the window to ${worryLevel(laterAvg)} in the newer half.`,
	};
}

export function lowInfoLabel(ratio: number): string {
	if (ratio >= 0.5) return "Mostly vague messages";
	if (ratio >= 0.25) return "Some vague messages";
	return "Mostly descriptive messages";
}

// --- SHAP factors ---

export type FactorKey = Exclude<keyof ShapBreakdown, "baseRate">;

// Names are direction-neutral: a SHAP contribution's sign depends on whether
// the file sits above or below the typical file, not on the feature alone.
export const FACTOR_NAME: Record<FactorKey, string> = {
	sentimentContrib: "Commit message tone",
	complexityContrib: "Code complexity",
	lowInfoContrib: "Commit message detail",
	entropyContrib: "How scattered changes are",
	ndevContrib: "Number of developers",
	ageContrib: "File age",
	commitsContrib: "How active the file is",
};

/**
 * How much of the score's influence comes from commit tone vs code structure and
 * history, as |SHAP| sums. Low-info only counts when it raises risk.
 */
export function toneVsStructure(shap: ShapBreakdown | null | undefined): {
	tone: number;
	structure: number;
} {
	const s = shap;
	const tone = Math.abs(s?.sentimentContrib ?? 0) + Math.max(0, s?.lowInfoContrib ?? 0);
	const structure =
		Math.abs(s?.entropyContrib ?? 0) +
		Math.abs(s?.ndevContrib ?? 0) +
		Math.abs(s?.ageContrib ?? 0) +
		Math.abs(s?.complexityContrib ?? 0) +
		Math.abs(s?.commitsContrib ?? 0);
	return { tone, structure };
}

// Phrase used inside the summary sentence ("Mainly because of ...").
const FACTOR_PHRASE: Record<FactorKey, string> = {
	sentimentContrib: "the tone of its commit messages",
	complexityContrib: "its code complexity",
	lowInfoContrib: "how detailed its commit messages are",
	entropyContrib: "how scattered its changes are",
	ndevContrib: "how many developers touch it",
	ageContrib: "its age",
	commitsContrib: "how often it changed",
};

export type FactorWeight = "Main reason" | "Contributing factor" | "Minor factor";

export type Factor = {
	key: FactorKey;
	name: string;
	contrib: number; // log-odds, kept for the Detailed view only
	share: number; // |c| / sum|c|, unit-free
	raises: boolean;
	weight: FactorWeight;
};

// ponytail: share cutoffs (.40 / .15) are design conventions, documented in
// Ch. 3 and validated by the usability survey, not derived from data.
export function factorWeight(share: number): FactorWeight {
	if (share >= 0.4) return "Main reason";
	if (share >= 0.15) return "Contributing factor";
	return "Minor factor";
}

/** SHAP contributions (log-odds) as unit-free shares, largest first. */
export function shapFactors(shap: ShapBreakdown): Factor[] {
	const keys = Object.keys(FACTOR_NAME) as FactorKey[];
	const total = keys.reduce((s, k) => s + Math.abs(shap[k]), 0);
	return keys
		.map((key) => {
			const contrib = shap[key];
			const share = total > 0 ? Math.abs(contrib) / total : 0;
			return {
				key,
				name: FACTOR_NAME[key],
				contrib,
				share,
				raises: contrib > 0,
				weight: factorWeight(share),
			};
		})
		.sort((a, b) => b.share - a.share);
}

/** One plain-language sentence explaining a file's score. */
export function summarizeFile(file: FileRiskResult, scale: RiskScale): string {
	const band = riskBand(file.riskScore, file.lowConfidence, scale);
	const info = RISK_BANDS[band];
	if (band === "insufficient") {
		return `${info.label}: this file had ${BELOW_GATE} in the analysis window, so Gomi does not score it.`;
	}
	const head = `${info.label} risk.`;
	if (!file.shapBreakdown) return `${head} ${info.meaning}`;

	const factors = shapFactors(file.shapBreakdown);
	const pick = (raises: boolean) =>
		factors
			.filter((f) => f.raises === raises && f.weight !== "Minor factor")
			.slice(0, 2)
			.map((f) => FACTOR_PHRASE[f.key]);

	// Explain what pushes the score toward its band.
	const up = isAtRisk(band) || band === "moderate";
	const reasons = pick(up);
	if (reasons.length === 0) return `${head} ${info.meaning}`;
	return `${head} ${up ? "Mainly because of" : "Kept low mainly by"} ${reasons.join(" and ")}.`;
}

// --- Formatting ---

export const fmtPct = (x: number): string => `${Math.round(x * 100)}%`;

export function fmtDate(unixSeconds: number): string {
	return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}
