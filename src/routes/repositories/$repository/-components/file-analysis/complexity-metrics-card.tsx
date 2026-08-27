import type { JSX } from "react";

import { GlossaryTerm } from "@/components/ui/glossary-term";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";
import type { GlossaryKey } from "@/lib/glossary";

export function ComplexityMetricsCard({
	file,
	allFiles = [],
}: {
	file: FileRiskResult;
	allFiles?: FileRiskResult[];
}): JSX.Element {
	const calculateMetricTag = (
		getValue: (f: FileRiskResult) => number,
		currentValue: number,
		decimals = 2,
	) => {
		const avg =
			allFiles.length > 0
				? allFiles.reduce((acc, f) => acc + getValue(f), 0) / allFiles.length
				: 0;
		const diff = currentValue - avg;
		const pctOver = avg > 0 ? Math.round((diff / avg) * 100) : 0;
		const isOver = diff > 0;
		const tag = isOver
			? `REPO AVG: ${avg.toFixed(decimals)} · ${pctOver}% OVER`
			: `REPO AVG: ${avg.toFixed(decimals)} · WITHIN AVG`;
		return { tag, isOver };
	};

	const metricComplexity = calculateMetricTag((f) => f.complexityScore, file.complexityScore);
	const metricEntropy = calculateMetricTag((f) => f.changeEntropy, file.changeEntropy);
	const metricNdev = calculateMetricTag((f) => f.ndevScore, file.ndevScore);
	const metricAge = calculateMetricTag((f) => f.ageScore, file.ageScore);
	const metricLowInfo = calculateMetricTag((f) => f.lowInfoRatio, file.lowInfoRatio);
	const metricCommits = calculateMetricTag((f) => f.commitCount, file.commitCount, 0);
	const metricCcn = calculateMetricTag((f) => f.avgCcn, file.avgCcn, 1);
	const metricNloc = calculateMetricTag((f) => f.avgNloc, file.avgNloc, 1);

	const metrics: Array<{
		label: string;
		value: string;
		desc: string;
		tag: string;
		isOver: boolean;
		termKey?: GlossaryKey;
	}> = [
		{
			label: "Complexity score",
			value: file.complexityScore.toFixed(2),
			desc: "normalized Lizard complexity",
			tag: metricComplexity.tag,
			isOver: metricComplexity.isOver,
		},
		{
			label: "Change entropy",
			value: file.changeEntropy.toFixed(2),
			desc: "how dispersed edits are across the file",
			tag: metricEntropy.tag,
			isOver: metricEntropy.isOver,
			termKey: "changeEntropy",
		},
		{
			label: "NDev score",
			value: file.ndevScore.toFixed(2),
			desc: "distinct developers who touched it",
			tag: metricNdev.tag,
			isOver: metricNdev.isOver,
			termKey: "ndev",
		},
		{
			label: "Age score",
			value: file.ageScore.toFixed(2),
			desc: "normalized churn recency",
			tag: metricAge.tag,
			isOver: metricAge.isOver,
			termKey: "ageScore",
		},
		{
			label: "Low info ratio",
			value: file.lowInfoRatio.toFixed(2),
			desc: "share of low-information commits",
			tag: metricLowInfo.tag,
			isOver: metricLowInfo.isOver,
			termKey: "lowInfoRatio",
		},
		{
			label: "Number of commits",
			value: String(file.commitCount),
			desc: "commits in analysis window",
			tag: metricCommits.tag,
			isOver: metricCommits.isOver,
		},
		{
			label: "Avg CCN",
			value: file.avgCcn.toFixed(1),
			desc: "average cyclomatic complexity",
			tag: metricCcn.tag,
			isOver: metricCcn.isOver,
			termKey: "ccn",
		},
		{
			label: "Avg NLOC",
			value: file.avgNloc.toFixed(1),
			desc: "average lines per function",
			tag: metricNloc.tag,
			isOver: metricNloc.isOver,
			termKey: "nloc",
		},
	];

	return (
		<Card>
			<CardHeader>
				<p className="font-fira-mono-bold text-foreground text-xl">Complexity metrics</p>
				<p className="font-fira-mono text-muted-foreground mt-1 text-xs">
					Lizard static analysis + repository process metrics
				</p>
			</CardHeader>
			<CardContent>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(2, 1fr)",
						gap: "0.75rem",
					}}
				>
					{metrics.map(({ label, value, desc, tag, isOver, termKey }) => (
						<div
							key={label}
							style={{
								borderRadius: "0.5rem",
								border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
								padding: "1rem",
								backgroundColor: "var(--background-800)",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "flex-start",
									justifyContent: "space-between",
									gap: "0.5rem",
								}}
							>
								<p className="font-fira-mono-bold text-foreground text-sm">
									{termKey ? (
										<GlossaryTerm termKey={termKey} variant="icon">
											{label}
										</GlossaryTerm>
									) : (
										label
									)}
								</p>
								<p
									className="font-fira-mono-bold shrink-0 text-lg tabular-nums"
									style={{ color: "var(--caution-500)" }}
								>
									{value}
								</p>
							</div>
							<p className="font-fira-mono text-muted-foreground mt-1 text-xs">
								{desc}
							</p>
							{tag && (
								<div className="mt-2.5">
									<span
										className="font-fira-mono-bold rounded px-2 py-0.5 text-[10px] tracking-wider uppercase"
										style={{
											backgroundColor: isOver
												? "var(--caution-900)"
												: "var(--background-700)",
											color: isOver
												? "var(--caution-500)"
												: "var(--text-subtle)",
											border: isOver
												? "1px solid color-mix(in srgb, var(--caution-500) 30%, transparent)"
												: "1px solid transparent",
										}}
									>
										{tag}
									</span>
								</div>
							)}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
