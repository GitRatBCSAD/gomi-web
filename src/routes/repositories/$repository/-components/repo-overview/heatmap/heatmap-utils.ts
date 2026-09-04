import type { FileRiskResult } from "@/lib/github/model";
import type { Theme } from "@/lib/theme";

export type RiskCategory = "risky" | "acceptable" | "low-conf";
export type FilterKey = "all" | RiskCategory;
export type SortOption = "risk-desc" | "risk-asc" | "complexity-desc" | "commits-desc" | "name-asc";

export type FileInfo = {
	name: string;
	dir: string;
	risk: number;
	complexity: number;
	commits: number;
	lowConf: boolean;
	sentimentRisky: number;
	sentimentCaution: number;
	sentimentOk: number;
};

export type TreeNode = {
	name: string;
	risk?: number;
	complexity?: number;
	commits?: number;
	lowConf?: boolean;
	dir?: string;
	children?: TreeNode[];
};

export function toFileInfo(r: FileRiskResult): FileInfo {
	const parts = r.filename.split("/");
	const name = parts.pop() ?? r.filename;
	const dir = parts.length > 0 ? parts.join("/") + "/" : "";

	const total = r.commitSentiments.length;
	let risky = 0;
	let caution = 0;
	let ok = 0;
	if (total > 0) {
		for (const s of r.commitSentiments) {
			const label = s.sentiment?.code ?? null;
			if (label === "caution") risky++;
			else if (label === "neutral") caution++;
			else if (label === "satisfaction") ok++;
			else caution++;
		}
	}

	return {
		name,
		dir,
		risk: r.riskScore ?? 0,
		complexity: r.complexityScore,
		commits: total,
		lowConf: r.lowConfidence,
		sentimentRisky: total > 0 ? risky / total : 0,
		sentimentCaution: total > 0 ? caution / total : 0,
		sentimentOk: total > 0 ? ok / total : 0,
	};
}

export const HATCH =
	"repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 6px)";

const LEGEND_GRADIENT_BY_THEME: Record<Theme, string> = {
	light: "linear-gradient(to right, #16a34a 0%, #8bb90c 30%, #d9a80a 55%, #e8730a 75%, #dc2626 100%)",
	dark: "linear-gradient(to right, #204426 0%, #3a5f2d 30%, #8a7435 55%, #af5a3f 75%, #c04838 100%)",
};

export function legendGradient(theme: Theme): string {
	return LEGEND_GRADIENT_BY_THEME[theme];
}

export const DOT_COLOR: Record<RiskCategory, string> = {
	risky: "var(--destructive)",
	acceptable: "var(--primary)",
	"low-conf": "var(--muted-foreground)",
};

export const FILTERS: { key: FilterKey; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "risky", label: "Risky" },
	{ key: "acceptable", label: "Acceptable" },
	{ key: "low-conf", label: "Low conf" },
];

export const DIR_LABEL_HEIGHT = 20;

export function getCategory(f: FileInfo, threshold: number): RiskCategory {
	if (f.lowConf) return "low-conf";
	return f.risk >= threshold ? "risky" : "acceptable";
}

const RISK_STOPS_BY_THEME: Record<Theme, [number, [number, number, number]][]> = {
	light: [
		[0.0, [22, 163, 74]],
		[0.3, [139, 185, 12]],
		[0.5, [217, 168, 10]],
		[0.65, [232, 115, 10]],
		[0.8, [224, 60, 30]],
		[1.0, [220, 38, 38]],
	],
	dark: [
		[0.0, [32, 68, 38]],
		[0.3, [58, 82, 42]],
		[0.5, [92, 95, 45]],
		[0.65, [120, 100, 50]],
		[0.8, [175, 90, 72]],
		[1.0, [195, 80, 62]],
	],
};

export function riskColor(risk: number, theme: Theme): string {
	const stops = RISK_STOPS_BY_THEME[theme];
	let lo = stops[0],
		hi = stops[stops.length - 1];
	for (let i = 0; i < stops.length - 1; i++) {
		if (risk >= stops[i][0] && risk <= stops[i + 1][0]) {
			lo = stops[i];
			hi = stops[i + 1];
			break;
		}
	}
	const t = lo[0] === hi[0] ? 0 : (risk - lo[0]) / (hi[0] - lo[0]);
	const [r, g, b] = lo[1].map((c, i) => Math.round(c + (hi[1][i] - c) * t));
	return `rgb(${r},${g},${b})`;
}
