import type { JSX } from "react";

import { P } from "@/components/typography";
import type { FileRiskResult } from "@/lib/github/model";
import { RISK_BANDS, type RiskBand, type RiskScale } from "@/lib/interpret";

const pct = (x: number) => `${Math.min(100, Math.max(0, x * 100))}%`;

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
	const others = allFiles
		.filter((f) => !f.lowConfidence && f.riskScore != null && f.filename !== file.filename)
		.map((f) => f.riskScore as number);
	const safer = others.filter((s) => s < score).length;
	const total = others.length + 1;

	return (
		<div className="space-y-2">
			<div className="relative h-12" aria-hidden="true">
				<div className="bg-muted absolute inset-x-0 top-5 h-2 rounded-full" />
				<div
					className="absolute top-5 right-0 h-2 rounded-r-full"
					style={{ left: pct(scale.threshold), backgroundColor: RISK_BANDS.high.bg }}
				/>
				{others.map((s, i) => (
					<span
						key={i}
						className="bg-muted-foreground/45 absolute top-4 h-4 w-px"
						style={{ left: pct(s) }}
					/>
				))}
				<span
					className="border-muted-foreground absolute top-2.5 h-7 border-l border-dashed"
					style={{ left: pct(scale.threshold) }}
				/>
				<span
					className="text-muted-foreground absolute top-9 -translate-x-1/2 text-[11px] whitespace-nowrap"
					style={{ left: pct(scale.threshold) }}
				>
					Warning line
				</span>
				<span
					className="ring-background absolute top-2 h-8 w-1.5 -translate-x-1/2 rounded-full ring-2"
					style={{ left: pct(score), backgroundColor: RISK_BANDS[band].fill }}
				/>
				<span
					className="absolute -top-2.5 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap"
					style={{ left: `clamp(2rem, ${pct(score)}, calc(100% - 2rem))`, color: RISK_BANDS[band].fg }}
				>
					This file
				</span>
			</div>
			<div className="text-muted-foreground flex justify-between text-xs">
				<span>Safer</span>
				<span>Riskier</span>
			</div>
			<P className="text-foreground text-sm">
				Riskier than{" "}
				<span className="font-semibold">
					{safer} of {total - 1}
				</span>{" "}
				other scored files in this repository.
				<span className="text-muted-foreground"> Each tick is one file.</span>
			</P>
		</div>
	);
}
