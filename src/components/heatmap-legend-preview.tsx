import type { JSX } from "react";

import {
	HATCH,
	legendGradient,
	riskColor,
} from "@/routes/repositories/$repository/-components/repo-overview/heatmap/heatmap-utils";

// This preview always renders inside the (fixed-dark) driver.js tour popover, so it
// intentionally uses the dark risk palette regardless of the app's active theme.
const PREVIEW_THEME = "dark" as const;

// Sample tiles for the legend — width encodes complexity, color encodes risk,
// the hatched one is low-confidence. Same riskColor + HATCH the live map uses.
const SAMPLE_TILES = [
	{ name: "auth.go", risk: 0.86, w: 132, lowConf: false },
	{ name: "parser.ts", risk: 0.58, w: 104, lowConf: false },
	{ name: "utils.py", risk: 0.24, w: 72, lowConf: false },
	{ name: "cli.rs", risk: 0.35, w: 60, lowConf: true },
];

/** A miniature, non-interactive heatmap with the risk gradient legend beneath. */
export function HeatmapLegendPreview(): JSX.Element {
	return (
		<div className="flex flex-col items-start gap-2 rounded-lg border border-white/10 bg-[#0b0d10] p-4">
			<div className="flex flex-wrap items-end gap-1.5" style={{ maxWidth: 200 }}>
				{SAMPLE_TILES.map((t) => (
					<div
						key={t.name}
						className="border-dark-500 relative overflow-hidden border"
						style={{
							width: t.w,
							height: t.w * 0.62,
							backgroundColor: riskColor(t.risk, PREVIEW_THEME),
						}}
						title={`${t.name} — ${t.lowConf ? "low confidence" : t.risk.toFixed(2)}`}
					>
						{t.lowConf && (
							<div className="absolute inset-0" style={{ backgroundImage: HATCH }} />
						)}
						<span className="font-fira-mono absolute right-1 bottom-1 left-1 truncate text-[10px] text-white/80">
							{t.name}
						</span>
					</div>
				))}
			</div>
			<div
				className="mt-1 h-2 w-full rounded-full"
				style={{ backgroundImage: legendGradient(PREVIEW_THEME) }}
			/>
			<div className="font-fira-mono flex w-full justify-between text-[10px] text-gray-500">
				<span>low risk</span>
				<span>high risk</span>
			</div>
		</div>
	);
}

/** The colored risk-band key. Shared by the guide and the onboarding modal. */
export function RiskLegendRows(): JSX.Element {
	return (
		<ul className="font-fira-mono space-y-2.5 text-sm text-gray-400">
			<li className="flex items-center gap-3">
				<span
					className="inline-block size-4 shrink-0 rounded-sm"
					style={{ backgroundColor: riskColor(0.85, PREVIEW_THEME) }}
				/>
				High risk — likely heading for a fix
			</li>
			<li className="flex items-center gap-3">
				<span
					className="inline-block size-4 shrink-0 rounded-sm"
					style={{ backgroundColor: riskColor(0.5, PREVIEW_THEME) }}
				/>
				Moderate — worth a glance
			</li>
			<li className="flex items-center gap-3">
				<span
					className="inline-block size-4 shrink-0 rounded-sm"
					style={{ backgroundColor: riskColor(0.15, PREVIEW_THEME) }}
				/>
				Low — quiet and stable
			</li>
			<li className="flex items-center gap-3">
				<span
					className="border-dark-500 inline-block size-4 shrink-0 rounded-sm border"
					style={{ backgroundImage: HATCH, backgroundColor: "#1a1c1f" }}
				/>
				Hatched — too few commits to score confidently
			</li>
		</ul>
	);
}
