import * as v from "valibot";

import { enumDetailSchema } from "../utils";

enum Sentiment {
	Caution = "caution",
	Neutral = "neutral",
	Satisfaction = "satisfaction",
}

export const RepositorySchema = v.object({
	id: v.number(),
	name: v.string(),
	fullName: v.string(),
	private: v.boolean(),
	htmlUrl: v.pipe(v.string(), v.url()),
});
export type Repository = v.InferOutput<typeof RepositorySchema>;

export const RepositoriesResponseSchema = v.object({
	installationsCount: v.number(),
	repositories: v.array(RepositorySchema),
});
export type RepositoriesResponse = v.InferOutput<typeof RepositoriesResponseSchema>;

export type AnalyzeRepositoryRequest = {
	id: string;
	owner: string;
	repository: string;
	force?: boolean;
	/** ISO-8601 date string. If omitted, backend defaults to 6 months back. */
	sinceDate?: string;
	/** ISO-8601 date string. If omitted, backend defaults to now. */
	untilDate?: string;
};

export const CommitSentimentSchema = v.object({
	hash: v.string(),
	message: v.string(),
	committedAt: v.number(),
	sentiment: v.nullable(enumDetailSchema(Sentiment)),
	lowInfo: v.boolean(),
	riskProbability: v.nullable(v.number()),
	// Commit provenance (Tier 1 — from git log --numstat)
	author: v.optional(v.nullable(v.string())),
	linesAdded: v.optional(v.nullable(v.number())),
	linesDeleted: v.optional(v.nullable(v.number())),
	coChangedFiles: v.optional(v.nullable(v.number())),
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
	riskScore: v.nullable(v.number()),
	sentimentScore: v.number(),
	complexityScore: v.number(),
	changeEntropy: v.number(),
	ndevScore: v.number(),
	ageScore: v.number(),
	lowInfoRatio: v.number(),
	commitCount: v.number(),
	avgCcn: v.number(),
	avgNloc: v.number(),
	lowConfidence: v.boolean(),
	shapBreakdown: v.nullable(ShapBreakdownSchema),
	commitSentiments: v.array(CommitSentimentSchema),
});

export const AnalysisResultSchema = v.object({
	repoUrl: v.string(),
	headSha: v.string(),
	defaultBranch: v.string(),
	threshold: v.number(),
	fileResults: v.array(FileRiskResultSchema),
});

export type CommitSentiment = v.InferOutput<typeof CommitSentimentSchema>;
export type ShapBreakdown = v.InferOutput<typeof ShapBreakdownSchema>;
export type FileRiskResult = v.InferOutput<typeof FileRiskResultSchema>;
export type AnalysisResult = v.InferOutput<typeof AnalysisResultSchema>;

export const AnalyzeJobResponseSchema = v.object({
	jobId: v.string(),
});
export type AnalyzeJobResponse = v.InferOutput<typeof AnalyzeJobResponseSchema>;

export const JobStatusSchema = v.object({
	status: v.string(),
	step: v.string(),
	progress: v.number(),
	current_file: v.optional(v.string()),
	result: v.optional(AnalysisResultSchema),
	error: v.optional(v.string()),
});
export type JobStatus = v.InferOutput<typeof JobStatusSchema>;

