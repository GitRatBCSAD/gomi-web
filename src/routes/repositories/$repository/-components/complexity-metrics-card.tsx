import type { JSX } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";

export function ComplexityMetricsCard({
	file,
	allFiles = [],
}: {
	file: FileRiskResult;
	allFiles?: FileRiskResult[];
}): JSX.Element {
	const repoAvgComplexity =
		allFiles.length > 0
			? allFiles.reduce((acc, f) => acc + f.complexityScore, 0) / allFiles.length
			: 0;

	const diff = file.complexityScore - repoAvgComplexity;
	const pctOver = repoAvgComplexity > 0 ? Math.round((diff / repoAvgComplexity) * 100) : 0;
	const tagText =
		diff > 0 ? `REPO AVG: ${repoAvgComplexity.toFixed(2)} · ${pctOver}% OVER` : `REPO AVG: ${repoAvgComplexity.toFixed(2)} · WITHIN AVG`;

	const metrics = [
		{
			label: "Complexity score",
			value: file.complexityScore.toFixed(2),
			desc: "normalized Lizard complexity",
			tag: tagText,
			isOver: diff > 0,
		},
		{
			label: "Change entropy",
			value: file.changeEntropy.toFixed(2),
			desc: "how dispersed edits are across the file",
		},
		{
			label: "NDev score",
			value: file.ndevScore.toFixed(2),
			desc: "distinct developers who touched it",
		},
		{ label: "Age score", value: file.ageScore.toFixed(2), desc: "normalized churn recency" },
		{
			label: "Low info ratio",
			value: file.lowInfoRatio.toFixed(2),
			desc: "share of low-information commits",
		},
		{
			label: "Number of commits",
			value: String(file.commitCount),
			desc: "commits in analysis window",
		},
		{ label: "Avg CCN", value: file.avgCcn.toFixed(1), desc: "average cyclomatic complexity" },
		{ label: "Avg NLOC", value: file.avgNloc.toFixed(1), desc: "average lines per function" },
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
					{metrics.map(({ label, value, desc, tag, isOver }) => (
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
									{label}
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
