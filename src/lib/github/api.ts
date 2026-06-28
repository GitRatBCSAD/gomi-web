import { queryOptions } from "@tanstack/react-query";
import * as v from "valibot";

import { ApiResponseSchema } from "../api";
import { BACKEND_URL } from "../env";
import { RepositorySchema, type AnalyzeRepositoryRequest, type Repository } from "./model";

export async function getRepositories(): Promise<Repository[]> {
	const token = localStorage.getItem("github_token");
	const response = await fetch(`${BACKEND_URL}/repositories`, {
		headers: { Authorization: `Bearer ${token}` },
		method: "GET",
	});
	const result = await response.json();
	const parsed = v.parse(ApiResponseSchema(v.array(RepositorySchema)), result);

	return parsed.data ?? [];
}

export const getRepositoriesQuery = queryOptions({
	queryKey: ["repository"],
	queryFn: getRepositories,
	staleTime: 5 * 60 * 1000,
	refetchOnWindowFocus: false,
});

export async function analyzeRepository(data: AnalyzeRepositoryRequest): Promise<unknown> {
	const token = localStorage.getItem("github_token");
	const res = await fetch(`${BACKEND_URL}/repositories`, {
		method: "POST",
		headers: { Authorization: `Bearer ${token}` },
		body: JSON.stringify(data),
	});
	return await res.json();
}
