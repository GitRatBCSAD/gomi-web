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

export async function getRepositories(): Promise<RepositoriesResponse> {
	const response = await fetch(`${BACKEND_URL}/repositories`, {
		method: "GET",
		credentials: "include",
	});
	const result = await response.json();
	const parsed = v.parse(ApiResponseSchema(RepositoriesResponseSchema), result);

	return parsed.data ?? { installationsCount: 0, repositories: [] };
}

export const getRepositoriesQuery = queryOptions({
	queryKey: ["repository"],
	queryFn: getRepositories,
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
	const parsed = v.parse(ApiResponseSchema(AnalysisResultSchema), json);
	return parsed.data;
}
