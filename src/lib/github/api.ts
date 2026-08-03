import { queryOptions } from "@tanstack/react-query";
import * as v from "valibot";

import { ApiResponseSchema } from "../api";
import { BACKEND_URL } from "../env";
import {
	AnalysisResultSchema,
	RepositoriesResponseSchema,
	type AnalysisResult,
	type AnalyzeRepositoryRequest,
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

export async function analyzeRepository(data: AnalyzeRepositoryRequest): Promise<AnalysisResult> {
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
	const parsed = v.parse(ApiResponseSchema(AnalysisResultSchema), json);
	return parsed.data;
}
