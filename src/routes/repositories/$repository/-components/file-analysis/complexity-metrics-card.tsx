import type { JSX } from "react";

import { GlossaryHint } from "@/components/glossary-hint";
import { H1, P } from "@/components/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";
import type { GlossaryKey } from "@/lib/glossary";
import {
	ccnLabel,
	ccnTone,
	lowInfoLabel,
	percentileLabel,
	percentileTone,
	type Tone,
} from "@/lib/interpret";

const TONE_COLOR: Record<Tone, string> = {
	bad: "var(--risk-very-high-ink)",
	warn: "var(--risk-moderate-ink)",
	neutral: "var(--foreground)",
	good: "var(--success-500)",
};

/** Share of files in the repo with a strictly lower value (0-1). */
function rankIn(all: FileRiskResult[], get: (f: FileRiskResult) => number, v: number): number {
	return all.length ? all.filter((f) => get(f) < v).length / all.length : 0;
}

// CCN's label is an absolute McCabe band (Table 19), so its marker uses the same bands,
// one quarter each, instead of a repo rank: a "Simple" file must sit on the left.
function ccnPosition(ccn: number): number {
	const seg = (lo: number, hi: number, i: number) =>
		(i + Math.min(1, Math.max(0, (ccn - lo) / (hi - lo)))) / 4;
	if (ccn <= 10) return seg(1, 10, 0);
	if (ccn <= 20) return seg(10, 20, 1);
	if (ccn <= 50) return seg(20, 50, 2);
	return seg(50, 100, 3);
}

const higherThan = (pct: number) => `Higher than ${Math.round(pct * 100)}% of files in this repo`;

export function ComplexityMetricsCard({
	file,
	allFiles = [],
	id,
}: {
	file: FileRiskResult;
	allFiles?: FileRiskResult[];
	id?: string;
}): JSX.Element {
	const commitsPct = rankIn(allFiles, (f) => f.commitCount, file.commitCount);
	const nlocPct = rankIn(allFiles, (f) => f.avgNloc, file.avgNloc);

	const metrics: {
		label: string;
		term: GlossaryKey;
		verdict: string;
		tone: Tone;
		pct: number; // position among this repo's files, 0-1
		detail: string;
	}[] = [
		{
			label: "Overall complexity",
			pct: file.complexityScore,
			term: "complexity-score",
			verdict: percentileLabel(file.complexityScore),
			tone: percentileTone(file.complexityScore),
			detail: higherThan(file.complexityScore),
		},
		{
			label: "Decision paths per function",
			pct: ccnPosition(file.avgCcn),
			term: "cyclomatic-complexity",
			verdict: ccnLabel(file.avgCcn),
			tone: ccnTone(file.avgCcn),
			detail: `Average ${file.avgCcn.toFixed(1)} paths per function`,
		},
		{
			label: "Function length",
			pct: nlocPct,
			term: "nloc",
			verdict: percentileLabel(nlocPct),
			tone: percentileTone(nlocPct),
			detail: `About ${Math.round(file.avgNloc)} lines · ${higherThan(nlocPct).toLowerCase()}`,
		},
		{
			label: "How scattered changes are",
			pct: file.changeEntropy,
			term: "change-entropy",
			verdict: percentileLabel(file.changeEntropy),
			tone: percentileTone(file.changeEntropy),
			detail: higherThan(file.changeEntropy),
		},
		{
			label: "Number of developers",
			pct: file.ndevScore,
			term: "ndev",
			verdict: percentileLabel(file.ndevScore),
			tone: percentileTone(file.ndevScore),
			detail: higherThan(file.ndevScore),
		},
		{
			label: "File age",
			pct: file.ageScore,
			term: "age-score",
			verdict: percentileLabel(file.ageScore),
			tone: "neutral",
			detail: higherThan(file.ageScore),
		},
		{
			label: "Number of changes",
			pct: commitsPct,
			term: "n-commits",
			verdict: percentileLabel(commitsPct),
			tone: percentileTone(commitsPct),
			detail: `${file.commitCount} changes · ${higherThan(commitsPct).toLowerCase()}`,
		},
		{
			label: "Commit message detail",
			pct: file.lowInfoRatio,
			term: "low-info-ratio",
			verdict: lowInfoLabel(file.lowInfoRatio),
			tone: file.lowInfoRatio >= 0.5 ? "warn" : "neutral",
			detail: `${Math.round(file.lowInfoRatio * 100)}% of messages are under 5 words`,
		},
	];

	// Takeaway first: name the measures that stand out instead of making the reader scan 8 tiles.
	const standOut = metrics.filter((m) => m.tone === "bad" || m.tone === "warn");
	const takeaway =
		standOut.length === 0
			? "Nothing stands out: this file looks typical for this repository."
			: `${standOut.length} of ${metrics.length} measures stand out: ${standOut
					.map((m) => m.label.toLowerCase())
					.join(", ")}.`;

	return (
		<Card id={id}>
			<CardHeader>
				<H1 variant="h4">Code structure and change history</H1>
				<P className="text-muted-foreground">
					Further right means higher. Most rows compare this file with the rest of the
					repo.
				</P>
				<P className="text-foreground mt-2">{takeaway}</P>
			</CardHeader>
			<CardContent>
				<ul className="divide-border divide-y border-y">
					{metrics.map(({ label, term, verdict, tone, pct, detail }) => (
						<li
							key={label}
							className="grid grid-cols-1 gap-x-6 gap-y-1.5 py-3 sm:grid-cols-[1fr_10rem_10rem] sm:items-center"
						>
							<div className="min-w-0">
								<P className="text-foreground text-sm font-medium">
									{label}
									<GlossaryHint term={term} />
								</P>
								<P className="text-muted-foreground text-xs">{detail}</P>
							</div>
							<div
								className="bg-muted relative h-1.5 rounded-full"
								aria-hidden="true"
							>
								<span
									className="absolute -top-1 h-3.5 w-1 -translate-x-1/2 rounded-full"
									style={{
										left: `${Math.min(100, Math.max(0, pct * 100))}%`,
										backgroundColor:
											tone === "neutral"
												? "var(--muted-foreground)"
												: TONE_COLOR[tone],
									}}
								/>
							</div>
							<P
								className="text-sm font-semibold sm:text-right"
								style={{ color: TONE_COLOR[tone] }}
							>
								{verdict}
							</P>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
