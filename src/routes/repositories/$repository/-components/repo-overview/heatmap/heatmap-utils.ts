import type { FileRiskResult } from "@/lib/github/model";
import { riskBand, type RiskBand, type RiskScale } from "@/lib/interpret";

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
	band: RiskBand;
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
	band?: RiskBand;
	dir?: string;
	children?: TreeNode[];
};

export function toFileInfo(r: FileRiskResult, scale: RiskScale): FileInfo {
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
		band: riskBand(r.riskScore, r.lowConfidence, scale),
		sentimentRisky: total > 0 ? risky / total : 0,
		sentimentCaution: total > 0 ? caution / total : 0,
		sentimentOk: total > 0 ? ok / total : 0,
	};
}

export const DOT_COLOR: Record<RiskCategory, string> = {
	risky: "var(--destructive)",
	acceptable: "var(--primary)",
	"low-conf": "var(--muted-foreground)",
};

export const FILTERS: { key: FilterKey; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "risky", label: "Needs attention" },
	{ key: "acceptable", label: "OK for now" },
	{ key: "low-conf", label: "Not enough history" },
];

export const DIR_LABEL_HEIGHT = 26;

// risky = High or Very High band (score >= threshold), acceptable = Low or Moderate.
export function categoryOf(band: RiskBand): RiskCategory {
	if (band === "insufficient") return "low-conf";
	return band === "high" || band === "very-high" ? "risky" : "acceptable";
}

export const getCategory = (f: FileInfo): RiskCategory => categoryOf(f.band);
