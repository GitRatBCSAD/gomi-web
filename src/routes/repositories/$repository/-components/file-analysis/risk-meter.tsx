import type { JSX, ReactNode } from "react";

import type { FileRiskResult } from "@/lib/github/model";
import {
	RISK_BANDS,
	riskBand,
	topFractionCut,
	type RiskBand,
	type RiskScale,
} from "@/lib/interpret";

const fmt = (x: number) => x.toLocaleString("en-US");

const SCORED_BANDS: RiskBand[] = ["low", "moderate", "high"];

function Stat({ label, children }: { label: string; children: ReactNode }): JSX.Element {
	return (
		<div className="bg-card space-y-1 p-4">
			<div className="text-muted-foreground text-xs">{label}</div>
			<div className="text-foreground text-sm">{children}</div>
		</div>
	);
}

/**
 * Header stats plus a strip of the repo's scored files, split by band and ordered
 * safest → riskiest, with this file marked at its rank.
 */
export function RiskMeter({
	file,
	allFiles,
	scale,
	band,
}: {
	file: FileRiskResult;
	allFiles: FileRiskResult[];
	scale: RiskScale;
	band: RiskBand;
}): JSX.Element | null {
	if (file.riskScore == null || file.lowConfidence) return null;
	const score = file.riskScore;
	const scored = allFiles.filter((f) => !f.lowConfidence && f.riskScore != null);
	const n = scored.length;
	const rank = 1 + scored.filter((f) => (f.riskScore as number) > score).length;
	const topPct = Math.max(1, Math.ceil((rank / n) * 100));

	const counts = SCORED_BANDS.map((b) => ({
		band: b,
		n: scored.filter((f) => riskBand(f.riskScore, false, scale) === b).length,
	}));
	const pos = (x: number) => `${(x / n) * 100}%`;

	const typicalChanges = Math.round(
		topFractionCut(
			allFiles.map((f) => f.commitCount),
			0,
			0.5,
		),
	);

	return (
		<div className="space-y-4">
			<div className="bg-border grid grid-cols-1 gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
				<Stat label="Rank in repo">
					<span className="text-xl font-semibold">#{fmt(rank)}</span>
					<span className="text-muted-foreground">
						{" "}
						of {fmt(n)}
						{topPct <= 50 && ` · top ${topPct}%`}
					</span>
				</Stat>
				<Stat label="Changes, last 6 months">
					<span className="text-xl font-semibold">{fmt(file.commitCount)}</span>
					<span className="text-muted-foreground">
						{" "}
						· typical file: {fmt(typicalChanges)}
					</span>
				</Stat>
			</div>

			<div className="space-y-2">
				<div className="relative pt-1" aria-hidden="true">
					<div className="flex h-2 w-full gap-px overflow-hidden rounded-full">
						{counts.map((c) =>
							c.n > 0 ? (
								<div
									key={c.band}
									style={{ flex: c.n, backgroundColor: RISK_BANDS[c.band].fill }}
								/>
							) : null,
						)}
					</div>
					<span
						className="ring-background bg-foreground absolute -top-1 h-6 w-1 -translate-x-1/2 rounded-full ring-2"
						style={{ left: pos(n - rank + 0.5) }}
					/>
				</div>
				<div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
					{counts.map((c) => (
						<span key={c.band} className="flex items-center gap-1.5">
							<span
								className="border-border size-2.5 rounded-[2px] border"
								style={{ backgroundColor: RISK_BANDS[c.band].fill }}
							/>
							<span className="text-foreground tabular-nums">{fmt(c.n)}</span>
							{RISK_BANDS[c.band].label}
						</span>
					))}
					<span className="ml-auto font-semibold" style={{ color: RISK_BANDS[band].fg }}>
						This file ▲
					</span>
				</div>
			</div>
		</div>
	);
}
