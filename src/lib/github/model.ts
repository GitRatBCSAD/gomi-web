import * as v from "valibot";

export const RepositorySchema = v.object({
	id: v.number(),
	name: v.string(),
	fullName: v.string(),
	private: v.boolean(),
	htmlUrl: v.pipe(v.string(), v.url()),
});
export type Repository = v.InferOutput<typeof RepositorySchema>;

export type AnalyzeRepositoryRequest = {
	owner: string;
	repository: string;
};

export const CommitSentimentSchema = v.object({
	message: v.string(),
	label: v.string(),
});

export const ShapBreakdownSchema = v.object({
	baseRate: v.number(),
	sentimentContrib: v.number(),
	complexityContrib: v.number(),
	lowInfoContrib: v.number(),
	entropyContrib: v.number(),
	ndevContrib: v.number(),
	ageContrib: v.number(),
	commitsContrib: v.number(),
});

export const FileRiskResultSchema = v.object({
	filename: v.string(),
	riskScore: v.number(),
	sentimentScore: v.number(),
	complexityScore: v.number(),
	lowConfidence: v.boolean(),
	shapBreakdown: v.nullable(ShapBreakdownSchema),
	commitSentiments: v.array(CommitSentimentSchema),
});

export const AnalysisResultSchema = v.object({
	repoUrl: v.string(),
	status: v.string(),
	threshold: v.number(),
	fileResults: v.array(FileRiskResultSchema),
});

export type CommitSentiment = v.InferOutput<typeof CommitSentimentSchema>;
export type ShapBreakdown = v.InferOutput<typeof ShapBreakdownSchema>;
export type FileRiskResult = v.InferOutput<typeof FileRiskResultSchema>;
export type AnalysisResult = v.InferOutput<typeof AnalysisResultSchema>;

const storageKey = (fullName: string) => `gomi:analysis:${fullName}`;

export function saveAnalysis(fullName: string, result: AnalysisResult): void {
	localStorage.setItem(storageKey(fullName), JSON.stringify(result));
}

export function loadAnalysis(fullName: string): AnalysisResult | null {
	const raw = localStorage.getItem(storageKey(fullName));
	if (!raw) return null;
	try {
		return v.parse(AnalysisResultSchema, JSON.parse(raw));
	} catch {
		return null;
	}
}
