import { describe, expect, it } from "vitest";

import type { CommitSentiment } from "@/lib/github/model";

import { computeDrift } from "./drift-utils";

const commits = (ps: number[]): CommitSentiment[] =>
	ps.map(
		(p, i) =>
			({
				hash: `h${i}`,
				message: "a commit message long enough",
				committedAt: 1000 + i,
				sentiment: null,
				lowInfo: false,
				riskProbability: p,
			}) as CommitSentiment,
	);

describe("computeDrift (EWMA chart, k = 3)", () => {
	it("flags a sustained rise in caution and points at a cautious commit", () => {
		const d = computeDrift(commits([...Array(10).fill(0.1), ...Array(10).fill(0.95)]), null)!;
		expect(d.hasSpike).toBe(true);
		expect(d.spikeDirection).toBe("up");
		expect(d.rootCauseCommit?.riskProbability).toBe(0.95);
	});

	it("does not flag noise around a steady level", () => {
		const d = computeDrift(commits([0.3, 0.6, 0.2, 0.5, 0.4, 0.3, 0.6, 0.2, 0.5, 0.4]), null)!;
		expect(d.hasSpike).toBe(false);
	});
});
