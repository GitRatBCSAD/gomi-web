import type { JSX } from "react";

import { GlossaryHint } from "@/components/glossary-hint";
import { RiskLabel } from "@/components/risk-label";
import { H1, P } from "@/components/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";
import type { GlossaryKey } from "@/lib/glossary";
import {
	baselineFromShap,
	cautionShareLabel,
	fmtPct,
	lowInfoLabel,
	percentileLabel,
	riskBand,
	shapFactors,
	type FactorKey,
	type RiskScale,
} from "@/lib/interpret";

const TERM: Record<FactorKey, GlossaryKey> = {
	sentimentContrib: "sentiment-score",
	complexityContrib: "complexity-score",
	entropyContrib: "change-entropy",
	ndevContrib: "ndev",
	lowInfoContrib: "low-info-ratio",
	ageContrib: "age-score",
	commitsContrib: "n-commits",
};

/** What this file looks like on each factor, in words. */
function fileValue(key: FactorKey, file: FileRiskResult): string {
	switch (key) {
		case "sentimentContrib": {
			const labelled = file.commitSentiments.filter((c) => c.sentiment);
			const caution = labelled.filter((c) => c.sentiment?.code === "caution").length;
			return cautionShareLabel(labelled.length ? caution / labelled.length : 0);
		}
		case "complexityContrib":
			return `${percentileLabel(file.complexityScore)} in repo`;
		case "entropyContrib":
			return `${percentileLabel(file.changeEntropy)} in repo`;
		case "ndevContrib":
			return `${percentileLabel(file.ndevScore)} in repo`;
		case "ageContrib":
			return `${percentileLabel(file.ageScore)} in repo`;
		case "lowInfoContrib":
			return lowInfoLabel(file.lowInfoRatio);
		case "commitsContrib":
			return `${file.commitCount} changes`;
	}
}

export function ShapBreakdownCard({
	file,
	scale,
	id,
}: {
	file: FileRiskResult;
	scale: RiskScale;
	id?: string;
}): JSX.Element | null {
	const s = file.shapBreakdown;
	if (!s) return null;

	const factors = shapFactors(s);
	const baseline = baselineFromShap(s) as number;
	const band = riskBand(file.riskScore, file.lowConfidence, scale);

	return (
		<Card id={id}>
			<CardHeader>
				<H1 variant="h4">
					What drives this score
					<GlossaryHint term="shap" />
				</H1>
				<P className="text-muted-foreground">
					Each factor either pushes this file's risk up (red) or down (blue). Longer bars
					matter more.
				</P>
			</CardHeader>
			<CardContent>
				<P className="text-muted-foreground border-b pb-3 text-sm">
					A typical file starts at about {fmtPct(baseline)}. The factors below move this
					file from there to its final level.
					<GlossaryHint term="base-rate" />
				</P>

				<ul>
					{factors.map((f) => {
						const color = f.raises ? "var(--destructive-500)" : "var(--primary-500)";
						return (
							<li
								key={f.key}
								className="grid grid-cols-1 gap-x-4 gap-y-1 border-b py-2.5 sm:grid-cols-[13rem_1fr_11rem] sm:items-center"
							>
								<span className="text-foreground text-sm">
									{f.name}
									<GlossaryHint term={TERM[f.key]} />
									<span className="text-muted-foreground block text-xs">
										This file: {fileValue(f.key, file)}
									</span>
								</span>
								<div
									className="h-2 overflow-hidden rounded-full"
									style={{ backgroundColor: "var(--background-700)" }}
								>
									<div
										className="h-2 rounded-full"
										style={{
											width: `${Math.max(f.share * 100, 2)}%`,
											backgroundColor: color,
										}}
									/>
								</div>
								<span
									className="text-sm sm:text-right"
									style={{ color }}
								>
									{f.weight} · {f.raises ? "raises" : "lowers"} risk
								</span>
							</li>
						);
					})}
				</ul>

				<div className="flex items-center justify-between gap-3 pt-4">
					<span className="text-muted-foreground text-sm">Result</span>
					<RiskLabel band={band} score={file.riskScore} />
				</div>

				<details className="text-muted-foreground mt-4 text-xs">
					<summary className="cursor-pointer">Show model numbers</summary>
					<P className="mt-2 text-xs">
						SHAP values are in log-odds: baseline {s.baseRate.toFixed(2)} plus the
						contributions below equals logit(score). Shares above are |contribution| ÷
						total |contribution|.
					</P>
					<table className="mt-2 w-full tabular-nums">
						<tbody>
							{factors.map((f) => (
								<tr key={f.key}>
									<td className="py-0.5">{f.name}</td>
									<td className="text-right">
										{f.contrib >= 0 ? "+" : ""}
										{f.contrib.toFixed(3)}
									</td>
									<td className="text-right">{fmtPct(f.share)}</td>
								</tr>
							))}
							<tr>
								<td className="py-0.5">Final score</td>
								<td className="text-right">{(file.riskScore ?? 0).toFixed(3)}</td>
								<td />
							</tr>
						</tbody>
					</table>
				</details>
			</CardContent>
		</Card>
	);
}
