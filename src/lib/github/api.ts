import { queryOptions } from "@tanstack/react-query";
import * as v from "valibot";

import { ApiResponseSchema } from "../api";
import { BACKEND_URL } from "../env";
import {
	AnalysisResultSchema,
	AnalyzeJobResponseSchema,
	JobStatusSchema,
	RepositoriesResponseSchema,
	type AnalysisResult,
	type AnalyzeRepositoryRequest,
	type JobStatus,
	type RepositoriesResponse,
} from "./model";

export async function getRepositories(forceRefresh?: boolean): Promise<RepositoriesResponse> {
	const url = forceRefresh ? `${BACKEND_URL}/repositories?refresh=true` : `${BACKEND_URL}/repositories`;
	const response = await fetch(url, {
		method: "GET",
		credentials: "include",
	});
	const result = await response.json();
	if (!response.ok) {
		throw new Error(result.message || "Failed to fetch repositories");
	}
	const parsed = v.parse(ApiResponseSchema(RepositoriesResponseSchema), result);

	return parsed.data ?? { installationsCount: 0, repositories: [] };
}

export const getRepositoriesQuery = queryOptions({
	queryKey: ["repository"],
	queryFn: () => getRepositories(),
	staleTime: 5 * 60 * 1000,
	refetchOnWindowFocus: false,
});

export type AnalyzeRepositoryResponse =
	| { type: "cached"; result: import("./model").AnalysisResult }
	| { type: "job"; jobId: string };

export async function analyzeRepository(data: AnalyzeRepositoryRequest): Promise<AnalyzeRepositoryResponse> {
	const res = await fetch(`${BACKEND_URL}/repositories`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(data),
	});
	const json = await res.json();
	if (!res.ok) {
		throw new Error(json.message || "Failed to analyze repository");
	}
	if (res.status === 200) {
		const parsed = v.parse(ApiResponseSchema(AnalysisResultSchema), json);
		return { type: "cached", result: parsed.data };
	}
	// 202 — job started
	const parsed = v.parse(ApiResponseSchema(AnalyzeJobResponseSchema), json);
	return { type: "job", jobId: parsed.data.jobId };
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
	const res = await fetch(`${BACKEND_URL}/repositories/jobs/${jobId}`, {
		credentials: "include",
	});
	const json = await res.json();
	if (!res.ok) {
		throw new Error(json.message || "Failed to get job status");
	}
	const parsed = v.parse(ApiResponseSchema(JobStatusSchema), json);
	return parsed.data;
}

export async function getAnalyzedRepositories(): Promise<string[]> {
	const res = await fetch(`${BACKEND_URL}/repositories/analyzed`, {
		credentials: "include",
	});
	const json = await res.json();
	if (!res.ok) throw new Error(json.message || "Failed to fetch analyzed repositories");
	const parsed = v.parse(ApiResponseSchema(v.array(v.string())), json);
	return parsed.data;
}

export async function getAnalysis(fullName: string): Promise<AnalysisResult> {
	const [owner, repo] = fullName.split("/");
	const url = `${BACKEND_URL}/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/analysis`;
	const res = await fetch(url, { credentials: "include" });
	const json = await res.json();
	if (!res.ok) throw new Error(json.message || "Analysis not found");
	try {
		const parsed = v.parse(ApiResponseSchema(AnalysisResultSchema), json);
		return parsed.data;
	} catch (e) {
		console.error("[getAnalysis] Valibot parse failed for", fullName, e);
		throw e;
	}
}

export const getAnalysisQueryOptions = (fullName: string) =>
	queryOptions({
		queryKey: ["analysis", fullName],
		queryFn: () => getAnalysis(fullName),
		staleTime: Infinity,
	});
