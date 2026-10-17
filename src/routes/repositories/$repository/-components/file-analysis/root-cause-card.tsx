import type { JSX } from "react";

import { GlossaryHint } from "@/components/glossary-hint";
import { H1, P } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";

import { DriftGuidanceBanner } from "./drift-guidance-banner";
import { computeDrift } from "./drift-utils";

export function RootCauseCard({
	file,
	threshold,
	id,
}: {
	file: FileRiskResult;
	threshold: number;
	id?: string;
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
	const affectiveSum = Math.abs(s?.sentimentContrib ?? 0) + Math.max(0, s?.lowInfoContrib ?? 0);
	const structuralSum =
		Math.abs(s?.entropyContrib ?? 0) +
		Math.abs(s?.ndevContrib ?? 0) +
		Math.abs(s?.ageContrib ?? 0) +
		Math.abs(s?.complexityContrib ?? 0) +
		Math.abs(s?.commitsContrib ?? 0);
	const totalShap = Math.max(0.01, affectiveSum + structuralSum);
	const sentimentPct = Math.round((affectiveSum / totalShap) * 100);
	const complexityPct = Math.round((structuralSum / totalShap) * 100);

	const commitDate = new Date(rootCommit.committedAt * 1000);
	const dateStr = commitDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	const dayLabel = commitDate.toLocaleDateString("en-US", { weekday: "long" });
	const timeLabel = commitDate.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});

	return (
		<Card id={id}>
			<CardHeader>
				<H1 variant="h4">Root Cause Commit</H1>
				<P className="text-muted-foreground">
					Highest caution risk commit identified in the analysis window
				</P>
			</CardHeader>
			<CardContent className="space-y-4">
				<DriftGuidanceBanner file={file} />

				<div className="flex items-start justify-between gap-4">
					<div>
						<div className="flex items-center gap-2">
							<span className="font-fira-mono text-muted-foreground text-sm font-bold">
								{rootCommit.hash.slice(0, 7)}
							</span>
							<span className="font-fira-mono text-muted-foreground/60 text-sm">
								· {dateStr}
							</span>
						</div>
						<P className="mt-1 font-bold">"{rootCommit.message}"</P>
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

				<div className="border-border/30 space-y-2 border-t pt-3">
					<P className="text-muted-foreground text-sm font-bold">
						Caution probability:{" "}
						<span style={{ color: "var(--destructive-500)" }}>
							{cautionProb.toFixed(2)}
						</span>
						<GlossaryHint term="caution-probability" />
					</P>

					<div className="space-y-2">
						<div className="flex items-center gap-3">
							<span className="font-fira-mono text-muted-foreground w-24 shrink-0 text-sm">
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
							<span className="font-fira-mono text-foreground w-10 text-right text-sm font-bold tabular-nums">
								{sentimentPct}%
							</span>
						</div>

						<div className="flex items-center gap-3">
							<span className="font-fira-mono text-muted-foreground w-24 shrink-0 text-sm">
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
							<span className="font-fira-mono text-foreground w-10 text-right text-sm font-bold tabular-nums">
								{complexityPct}%
							</span>
						</div>
					</div>
				</div>

				{/* Commit Provenance — Tier 1 socio-technical context */}
				{(rootCommit.author ||
					rootCommit.linesAdded != null ||
					rootCommit.linesDeleted != null ||
					rootCommit.coChangedFiles != null) && (
					<div className="border-border/30 space-y-1.5 border-t pt-3">
						<P className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
							Commit Context
						</P>
						<div className="font-fira-mono text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
							<span className="text-muted-foreground/60">Author</span>
							<span className="text-foreground truncate">
								{rootCommit.author || (
									<span className="text-muted-foreground/40 italic">unknown</span>
								)}
							</span>
							<span className="text-muted-foreground/60">When</span>
							<span className="text-foreground">
								{dayLabel} · {timeLabel}
							</span>
							{rootCommit.linesAdded != null && rootCommit.linesDeleted != null && (
								<>
									<span className="text-muted-foreground/60">Lines</span>
									<span>
										<span style={{ color: "var(--success-500, #4ade80)" }}>
											+{rootCommit.linesAdded}
										</span>{" "}
										<span style={{ color: "var(--destructive-500)" }}>
											−{rootCommit.linesDeleted}
										</span>
									</span>
								</>
							)}
							{rootCommit.coChangedFiles != null && (
								<>
									<span className="text-muted-foreground/60">Co-changed</span>
									<span className="text-foreground">
										{rootCommit.coChangedFiles}{" "}
										{rootCommit.coChangedFiles === 1 ? "file" : "files"}
									</span>
								</>
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
