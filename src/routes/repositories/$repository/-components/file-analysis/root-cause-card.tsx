import { InfoIcon } from "lucide-react";
import type { JSX } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";

import { computeDrift } from "./drift-utils";

export function RootCauseCard({
	file,
	threshold,
}: {
	file: FileRiskResult;
	threshold: number;
}): JSX.Element | null {
	if (file.lowConfidence || file.commitSentiments.length < 10) {
		return null;
	}

	const drift = computeDrift(file.commitSentiments, file.shapBreakdown);

	// guidance only shown when a spike is detected and root cause commit is identified
	if (!drift || !drift.rootCauseCommit) return null;

	const rootCommit = drift.rootCauseCommit;
	const cautionProb = rootCommit.riskProbability ?? 0;

	// Root cause only meaningful if the commit actually crossed the model threshold
	if (cautionProb < threshold) return null;

	const s = file.shapBreakdown;
	const affectiveSum = (s?.sentimentContrib ?? 0) + Math.max(0, s?.lowInfoContrib ?? 0);
	const structuralSum =
		(s?.entropyContrib ?? 0) +
		(s?.ndevContrib ?? 0) +
		(s?.ageContrib ?? 0) +
		(s?.complexityContrib ?? 0) +
		(s?.commitsContrib ?? 0);
	const totalShap = Math.max(0.01, Math.max(0, affectiveSum) + Math.max(0, structuralSum));
	const sentimentPct = Math.round((Math.max(0, affectiveSum) / totalShap) * 100);
	const complexityPct = Math.round((Math.max(0, structuralSum) / totalShap) * 100);

	const dateStr = new Date(rootCommit.committedAt * 1000).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return (
		<Card>
			<CardHeader>
				<p className="font-fira-mono-bold text-foreground text-xl">Root Cause Commit</p>
				<p className="font-fira-mono text-muted-foreground mt-1 text-xs">
					Highest caution risk commit identified in the analysis window
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-start justify-between gap-4">
					<div>
						<div className="flex items-center gap-2">
							<span className="font-fira-mono text-muted-foreground text-xs font-bold">
								{rootCommit.hash.slice(0, 7)}
							</span>
							<span className="font-fira-mono text-muted-foreground/60 text-xs">
								· {dateStr}
							</span>
						</div>
						<p className="font-fira-mono text-foreground mt-1 text-base font-bold">
							"{rootCommit.message}"
						</p>
					</div>
					<Badge
						style={{
							backgroundColor: "var(--destructive-900)",
							color: "var(--destructive-500)",
							borderColor: "transparent",
						}}
						className="shrink-0 font-bold"
					>
						Caution
					</Badge>
				</div>

				<div className="space-y-2 border-t border-border/30 pt-3">
					<p className="font-fira-mono text-muted-foreground text-xs font-bold">
						Caution probability:{" "}
						<span style={{ color: "var(--destructive-500)" }}>
							{cautionProb.toFixed(2)}
						</span>
					</p>

					<div className="space-y-2">
						<div className="flex items-center gap-3">
							<span className="font-fira-mono text-muted-foreground w-24 shrink-0 text-xs">
								Sentiment:
							</span>
							<div className="bg-background-700 h-2 flex-1 overflow-hidden rounded-full">
								<div
									className="h-2 rounded-full"
									style={{
										width: `${sentimentPct}%`,
										backgroundColor: "var(--destructive-500)",
									}}
								/>
							</div>
							<span className="font-fira-mono text-foreground w-10 text-right text-xs font-bold tabular-nums">
								{sentimentPct}%
							</span>
						</div>

						<div className="flex items-center gap-3">
							<span className="font-fira-mono text-muted-foreground w-24 shrink-0 text-xs">
								Complexity:
							</span>
							<div className="bg-background-700 h-2 flex-1 overflow-hidden rounded-full">
								<div
									className="h-2 rounded-full"
									style={{
										width: `${complexityPct}%`,
										backgroundColor: "var(--primary-500)",
									}}
								/>
							</div>
							<span className="font-fira-mono text-foreground w-10 text-right text-xs font-bold tabular-nums">
								{complexityPct}%
							</span>
						</div>
					</div>
				</div>

				<div className="bg-background-800 border-border/40 flex items-start gap-2.5 rounded-lg border p-3">
					<InfoIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
					<p className="font-fira-mono text-muted-foreground text-xs leading-relaxed">
						{drift.guidanceText}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
