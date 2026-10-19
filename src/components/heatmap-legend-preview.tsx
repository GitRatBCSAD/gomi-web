import type { JSX } from "react";

import { RISK_BANDS, type RiskBand } from "@/lib/interpret";

// Sample tiles for the legend. Same band colors the live map uses; every tile
// is the same size because the live treemap sizes tiles by file count only.
const SAMPLE_TILES: { name: string; band: RiskBand }[] = [
	{ name: "auth.go", band: "very-high" },
	{ name: "parser.ts", band: "high" },
	{ name: "api.ts", band: "moderate" },
	{ name: "utils.py", band: "low" },
	{ name: "cli.rs", band: "insufficient" },
	{ name: "db.go", band: "low" },
];

const tileColor = (b: RiskBand) =>
	b === "insufficient" ? "var(--background-700)" : RISK_BANDS[b].fg;

/** A miniature, non-interactive heatmap. */
export function HeatmapLegendPreview(): JSX.Element {
	return (
		<div className="border-border bg-card grid grid-cols-3 gap-1.5 rounded-lg border p-4">
			{SAMPLE_TILES.map((t) => (
				<div
					key={t.name}
					className="border-dark-500 relative h-14 w-20 overflow-hidden border"
					style={{ backgroundColor: tileColor(t.band) }}
					title={`${t.name}: ${RISK_BANDS[t.band].label}`}
				>
					<span
						className={`absolute right-1 bottom-1 left-1 truncate text-[10px] ${t.band === "insufficient" ? "text-white/80" : "text-black"}`}
					>
						{t.name}
					</span>
				</div>
			))}
		</div>
	);
}

const LEGEND_ORDER: RiskBand[] = ["very-high", "high", "moderate", "low", "insufficient"];

/** The colored risk-band key. Shared by the guide and the onboarding modal. */
export function RiskLegendRows(): JSX.Element {
	return (
		<ul className="text-muted-foreground space-y-2.5 text-sm">
			{LEGEND_ORDER.map((b) => (
				<li key={b} className="flex items-start gap-3">
					<span
						className="border-dark-500 mt-0.5 inline-block size-4 shrink-0 rounded-sm border"
						style={{ backgroundColor: tileColor(b) }}
					/>
					<span>
						<span className="text-foreground">{RISK_BANDS[b].label}</span> —{" "}
						{RISK_BANDS[b].meaning}
					</span>
				</li>
			))}
		</ul>
	);
}
