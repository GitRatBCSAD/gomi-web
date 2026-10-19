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
	bad: "var(--destructive-500)",
	warn: "var(--caution-500)",
	neutral: "var(--foreground)",
	good: "var(--success-500)",
};

/** Share of files in the repo with a strictly lower value (0-1). */
function rankIn(all: FileRiskResult[], get: (f: FileRiskResult) => number, v: number): number {
	return all.length ? all.filter((f) => get(f) < v).length / all.length : 0;
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
		desc: string;
		detail: string;
	}[] = [
		{
			label: "Overall complexity",
			term: "complexity-score",
			verdict: percentileLabel(file.complexityScore),
			tone: percentileTone(file.complexityScore),
			desc: "Branching logic and function length combined.",
			detail: higherThan(file.complexityScore),
		},
		{
			label: "Decision paths per function",
			term: "cyclomatic-complexity",
			verdict: ccnLabel(file.avgCcn),
			tone: ccnTone(file.avgCcn),
			desc: "Cyclomatic complexity (McCabe): 1–10 simple, 11–20 moderate, 21–50 complex, over 50 untestable.",
			detail: `Average ${file.avgCcn.toFixed(1)} paths per function`,
		},
		{
			label: "Function length",
			term: "nloc",
			verdict: percentileLabel(nlocPct),
			tone: percentileTone(nlocPct),
			desc: "Average lines of code per function.",
			detail: `About ${Math.round(file.avgNloc)} lines · ${higherThan(nlocPct).toLowerCase()}`,
		},
		{
			label: "How scattered changes are",
			term: "change-entropy",
			verdict: percentileLabel(file.changeEntropy),
			tone: percentileTone(file.changeEntropy),
			desc: "Whether edits to this file usually come with edits to many other files.",
			detail: higherThan(file.changeEntropy),
		},
		{
			label: "Number of developers",
			term: "ndev",
			verdict: percentileLabel(file.ndevScore),
			tone: percentileTone(file.ndevScore),
			desc: "How many different people changed this file.",
			detail: higherThan(file.ndevScore),
		},
		{
			label: "File age",
			term: "age-score",
			verdict: percentileLabel(file.ageScore),
			tone: "neutral",
			desc: "How long the file has been actively changed, from its first to its last change.",
			detail: higherThan(file.ageScore),
		},
		{
			label: "Number of changes",
			term: "n-commits",
			verdict: percentileLabel(commitsPct),
			tone: percentileTone(commitsPct),
			desc: "Commits that touched this file in the last 6 months.",
			detail: `${file.commitCount} changes · ${higherThan(commitsPct).toLowerCase()}`,
		},
		{
			label: "Commit message detail",
			term: "low-info-ratio",
			verdict: lowInfoLabel(file.lowInfoRatio),
			tone: file.lowInfoRatio >= 0.5 ? "warn" : "neutral",
			desc: "Messages under 5 words say too little to judge their tone.",
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
					How this file compares with the rest of the repository.
				</P>
				<P className="text-foreground mt-2">{takeaway}</P>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{metrics.map(({ label, term, verdict, tone, desc, detail }) => (
						<div
							key={label}
							className="rounded-lg border p-4"
							style={{ backgroundColor: "var(--background-800)" }}
						>
							<P className="text-muted-foreground text-sm">
								{label}
								<GlossaryHint term={term} />
							</P>
							<P
								className="font-semibold mt-1 text-lg"
								style={{ color: TONE_COLOR[tone] }}
							>
								{verdict}
							</P>
							<P className="text-muted-foreground mt-1 text-sm">{desc}</P>
							<P
								className="mt-2 text-xs"
								style={{ color: "var(--text-subtle)" }}
							>
								{detail}
							</P>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
