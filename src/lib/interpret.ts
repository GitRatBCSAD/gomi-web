// Verbal interpretation of model outputs. Single source of truth for every
// label shown in the UI; the same rules are documented in Chapter 3
// (references/CHAPTER3_VERBAL_INTERPRETATION.md). Change both together.

import type { CommitSentiment, FileRiskResult, ShapBreakdown } from "./github/model";

// Files with fewer window commits than this are not scored. UI text only: the
// microservice reads the real gate from risk_threshold.json "min_commits".
export const MIN_COMMITS = 1;

/** The commit gate in words: with a gate of 1, unscored files had no changes. */
export const BELOW_GATE = MIN_COMMITS <= 1 ? "no changes" : `fewer than ${MIN_COMMITS} changes`;

export type RiskBand = "low" | "moderate" | "high" | "insufficient";

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
	high: {
		band: "high",
		label: "High",
		meaning: "Above the model's warning line.",
		action: "Review this file before the next change and add tests or refactor.",
		fg: "var(--risk-very-high-ink)",
		bg: "var(--risk-very-high-tint)",
		fill: "var(--risk-very-high-fill)",
		onFill: "var(--risk-very-high-text)",
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

/** threshold: model warning line; median: this repository's median score. */
export type RiskScale = { threshold: number; median: number };

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

/** SHAP expected value is in log-odds; convert to the model's baseline probability. */
export function baselineFromShap(shap: ShapBreakdown | null | undefined): number | null {
	return shap ? sigmoid(shap.baseRate) : null;
}

/** Score of the last file inside the top `fraction`; `fallback` when nothing is scored. */
export function topFractionCut(scores: number[], fallback: number, fraction: number): number {
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
	};
}

/**
 * p = predicted probability that the file's 6-month window has a bug-inducing change.
 * Probabilities are not recalibrated, so the bands use the model's warning line plus
 * within-repository ranks (Chapter 3, Table 16).
 * Low      p < threshold and below the repo median
 * Moderate p < threshold and at or above the repo median
 * High     p >= threshold
 */
export function riskBand(p: number | null, lowConfidence: boolean, scale: RiskScale): RiskBand {
	if (lowConfidence || p == null) return "insufficient";
	if (p >= scale.threshold) return "high";
	return p >= scale.median ? "moderate" : "low";
}

export const isAtRisk = (b: RiskBand): boolean => b === "high";

// --- Percentile-rank features (0-1 within this repository) ---

// "Typical" is the interquartile range, the middle half of files (quartiles: NIST/SEMATECH
// e-Handbook, box plot, https://www.itl.nist.gov/div898/handbook/eda/section3/boxplot.htm).
// "Among the highest" is the top decile, the >90% very-high-risk cut of Alves, Ypma & Visser
// (2010), applied to file ranks rather than LOC volume.

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

/**
 * Average p(caution) over a set of commits, in words. 0.72 is the DistilBERT F1-optimal
 * caution threshold; at p >= 0.5 Caution is necessarily the most likely of the three classes.
 */
export function worryLevel(p: number): string {
	if (p >= CAUTION_THRESHOLD) return "mostly cautious";
	if (p >= 0.5) return "somewhat cautious";
	return "mostly calm";
}

export const TONE_LABEL: Record<string, string> = {
	caution: "Caution",
	neutral: "Neutral",
	satisfaction: "Positive",
};

export function toneLabel(code: string | null | undefined): string {
	return code ? (TONE_LABEL[code] ?? code) : "Too short to read";
}

/** Share of commits whose message reads as cautionary/urgent. */
export function cautionShareLabel(share: number): string {
	if (share >= 0.5) return "Mostly cautious";
	if (share >= 0.25) return "Often cautious";
	if (share > 0) return "Occasionally cautious";
	return "No cautious messages";
}

// --- Caution trend (older half vs newer half of readable commits) ---

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
	up: "Getting more cautious",
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
	const levelShift = worryLevel(laterAvg) !== worryLevel(earlierAvg);
	const trend: Trend =
		pctChange >= 10 || (levelShift && laterAvg > earlierAvg)
			? "up"
			: pctChange <= -10 || (levelShift && laterAvg < earlierAvg)
				? "down"
				: "steady";
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

// Derived, not chosen: the largest factor is the main reason, and any other factor
// counts as contributing when its share is at least what it would hold if all seven
// factors contributed equally (1/7).
export const EQUAL_SHARE = 1 / 7;

export function factorWeight(share: number, rank: number): FactorWeight {
	if (rank === 0 && share > 0) return "Main reason";
	if (share >= EQUAL_SHARE) return "Contributing factor";
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
			};
		})
		.sort((a, b) => b.share - a.share)
		.map((f, rank) => ({ ...f, weight: factorWeight(f.share, rank) }));
}

// Ways to reduce the underlying risk, one per actionable factor. Sources in
// references/UI_REFERENCES.md. Age can't be changed; tone and message detail are
// left out on purpose: asking for calmer or longer messages would lower the score
// without lowering the risk (Goodhart's law; Manheim & Garrabrant, 2018).
const FACTOR_SUGGESTION: Partial<Record<FactorKey, string>> = {
	complexityContrib: "Split long functions and cut down on branching (if/else, loops).",
	entropyContrib: "Keep each change to this file small and focused on one thing.",
	ndevContrib: "Give this file a clear owner who reviews changes to it.",
	commitsContrib: "Make sure every change to this file gets a code review.",
};

/** Suggestions for the non-minor factors that raise this file's risk, largest first. */
export function riskSuggestions(shap: ShapBreakdown | null | undefined): string[] {
	if (!shap) return [];
	return shapFactors(shap)
		.filter((f) => f.raises && f.weight !== "Minor factor")
		.flatMap((f) => FACTOR_SUGGESTION[f.key] ?? []);
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
