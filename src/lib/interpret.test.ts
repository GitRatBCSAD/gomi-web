import { describe, expect, it } from "vitest";

import type { FileRiskResult } from "./github/model";
import type { CommitSentiment } from "./github/model";
import {
	cautionShareLabel,
	ccnLabel,
	factorWeight,
	mannKendall,
	percentileLabel,
	riskBand,
	riskScale,
	riskSuggestions,
	shapFactors,
	topFractionCut,
	summarizeFile,
	toneVsStructure,
	worryTrend,
	type RiskScale,
} from "./interpret";

const scale: RiskScale = { threshold: 0.63, median: 0.5 };

function file(over: Partial<FileRiskResult> = {}): FileRiskResult {
	return {
		filename: "src/a.ts",
		riskScore: 0.7,
		sentimentScore: 0.4,
		complexityScore: 0.5,
		changeEntropy: 0.5,
		ndevScore: 0.5,
		ageScore: 0.5,
		lowInfoRatio: 0.1,
		commitCount: 20,
		avgCcn: 4,
		avgNloc: 20,
		lowConfidence: false,
		shapBreakdown: {
			baseRate: -1.36,
			sentimentContrib: 0.6,
			complexityContrib: 0.05,
			lowInfoContrib: -0.05,
			entropyContrib: 0,
			ndevContrib: 0.3,
			ageContrib: 0,
			commitsContrib: 0,
		},
		commitSentiments: [],
		...over,
	};
}

describe("riskBand", () => {
	it("uses the warning line, then repository ranks", () => {
		expect(riskBand(0.49, false, scale)).toBe("low");
		expect(riskBand(0.5, false, scale)).toBe("moderate");
		expect(riskBand(0.63, false, scale)).toBe("high");
		expect(riskBand(0.99, false, scale)).toBe("high");
	});

	it("never calls a file below the warning line High, however it ranks", () => {
		expect(riskBand(0.6, false, { threshold: 0.63, median: 0.3 })).toBe("moderate");
	});

	it("never scores low-confidence or null files", () => {
		expect(riskBand(0.9, true, scale)).toBe("insufficient");
		expect(riskBand(null, false, scale)).toBe("insufficient");
	});

	it("takes the median from scored files only", () => {
		const scores = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
		expect(topFractionCut(scores, 0.63, 0.2)).toBe(0.9);
		const files = scores.map((riskScore) => file({ riskScore }));
		files.push(file({ riskScore: 0.99, lowConfidence: true }), file({ riskScore: null }));
		expect(riskScale(files, 0.63)).toEqual({ threshold: 0.63, median: 0.6 });
		expect(topFractionCut([0.4], 0.63, 0.5)).toBe(0.4);
	});

	it("falls back to the warning line when nothing is scored", () => {
		expect(riskScale([file({ riskScore: null })], 0.63)).toEqual({
			threshold: 0.63,
			median: 0.63,
		});
	});
});

describe("labels", () => {
	it("reads percentile ranks by quartile", () => {
		expect(percentileLabel(0.1)).toBe("Lower than most");
		expect(percentileLabel(0.5)).toBe("Typical");
		expect(percentileLabel(0.8)).toBe("Higher than most");
		expect(percentileLabel(0.95)).toBe("Among the highest");
	});

	it("uses McCabe/SEI complexity bands", () => {
		expect(ccnLabel(10)).toBe("Simple");
		expect(ccnLabel(11)).toBe("Moderately complex");
		expect(ccnLabel(21)).toBe("Complex, hard to test");
		expect(ccnLabel(51)).toBe("Very complex, untestable");
	});
});

describe("shap", () => {
	it("turns log-odds into unit-free shares", () => {
		const f = shapFactors(file().shapBreakdown!);
		expect(f[0].key).toBe("sentimentContrib");
		expect(f[0].weight).toBe("Main reason");
		expect(f.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1);
	});

	it("weights factors by rank and the equal-share baseline (1/7)", () => {
		expect(factorWeight(0.2, 0)).toBe("Main reason");
		expect(factorWeight(0.15, 1)).toBe("Contributing factor");
		expect(factorWeight(0.14, 1)).toBe("Minor factor");
		expect(factorWeight(0, 0)).toBe("Minor factor");
	});

	it("summarizes with the top risk-raising factors", () => {
		expect(summarizeFile(file(), scale)).toBe(
			"High risk. Mainly because of the tone of its commit messages and how many developers touch it.",
		);
	});

	it("summarizes files without SHAP or history", () => {
		expect(summarizeFile(file({ shapBreakdown: null }), scale)).toMatch(/^High risk\./);
		expect(summarizeFile(file({ lowConfidence: true }), scale)).toMatch(/^Not enough history/);
	});
});

function commits(ps: (number | null)[]): CommitSentiment[] {
	return ps.map(
		(p, i) =>
			({
				hash: `h${i}`,
				message: "a commit message long enough",
				committedAt: 1000 + i,
				sentiment: null,
				lowInfo: p == null,
				riskProbability: p,
			}) as CommitSentiment,
	);
}

describe("mannKendall", () => {
	it("matches the textbook values for a strictly increasing series", () => {
		// n = 10: S = 45, Var(S) = 125, z = 44 / sqrt(125)
		const r = mannKendall([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		expect(r.s).toBe(45);
		expect(r.z).toBeCloseTo(44 / Math.sqrt(125), 6);
		expect(r.pValue).toBeLessThan(0.001);
	});

	it("finds no trend in a flat or all-tied series", () => {
		expect(mannKendall([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]).pValue).toBe(1);
	});
});

describe("worryTrend", () => {
	const rising = [0.1, 0.15, 0.2, 0.3, 0.35, 0.5, 0.6, 0.7, 0.8, 0.9];

	it("reads a significant rise, fall, or no trend", () => {
		expect(worryTrend(commits(rising))?.trend).toBe("up");
		expect(worryTrend(commits([...rising].reverse()))?.trend).toBe("down");
		expect(worryTrend(commits([0.3, 0.6, 0.2, 0.5, 0.4, 0.3, 0.6, 0.2, 0.5, 0.4]))?.trend).toBe(
			"steady",
		);
	});

	it("does not call a small two-point jump a trend", () => {
		expect(worryTrend(commits([0.2, 0.2, 0.8, 0.8]))?.trend).toBe("steady");
	});

	it("puts the averages into words", () => {
		const t = worryTrend(commits(rising))!;
		expect(t.headline).toBe("Getting more cautious");
		expect(t.sentence).toMatch(
			/mostly calm .* somewhat cautious|mostly calm .* mostly cautious/,
		);
	});

	it("skips unreadable commits and needs two readable ones", () => {
		expect(worryTrend(commits([0.9, null]))).toBeNull();
		expect(worryTrend(commits([null, 0.1, null, 0.9]))?.trend).toBe("steady");
	});

	it("does not divide by a zero earlier half", () => {
		expect(worryTrend(commits([0, 0, 0.5, 0.5]))?.pctChange).toBe(0);
	});
});

describe("toneVsStructure", () => {
	it("uses absolute contributions so negative structure still counts", () => {
		const { tone, structure } = toneVsStructure({
			...file().shapBreakdown!,
			sentimentContrib: 0.2,
			complexityContrib: -0.9,
			ndevContrib: 0,
		});
		expect(structure).toBeGreaterThan(tone);
	});
});

describe("riskSuggestions", () => {
	it("suggests only for actionable, non-minor factors that raise risk", () => {
		const shap = {
			baseRate: 0,
			sentimentContrib: 0.9, // raises, but tone is never suggested
			complexityContrib: 0.5,
			lowInfoContrib: 0,
			entropyContrib: -0.4, // lowers risk: no suggestion
			ndevContrib: 0.02, // minor: no suggestion
			ageContrib: 0.3, // can't be changed
			commitsContrib: 0,
		};
		expect(riskSuggestions(shap)).toEqual([
			"Split long functions and cut down on branching (if/else, loops).",
		]);
		expect(riskSuggestions(null)).toEqual([]);
	});
});

describe("cautionShareLabel", () => {
	it("uses natural frequencies and keeps 'Most' for a majority", () => {
		expect(cautionShareLabel(0)).toBe("No messages sound cautious");
		expect(cautionShareLabel(0.21)).toBe("About 1 in 5 messages sound cautious");
		expect(cautionShareLabel(0.34)).toBe("About 1 in 3 messages sound cautious");
		expect(cautionShareLabel(0.5)).toBe("Most messages sound cautious");
	});
});
