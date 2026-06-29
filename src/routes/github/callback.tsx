import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { JSX } from "react/jsx-runtime";
import * as v from "valibot";

import { ApiResponseSchema } from "@/lib/api";
import { BACKEND_URL } from "@/lib/env";

const SearchSchema = v.object({
	code: v.string(),
});

export const Route = createFileRoute("/github/callback")({
	validateSearch: SearchSchema,
	component: RouteComponent,
});

function RouteComponent(): JSX.Element {
	const navigate = useNavigate();
	const { code } = Route.useSearch();

	useQuery({
		queryKey: ["auth", code],
		queryFn: async () => {
			const res = await fetch(`${BACKEND_URL}/auth/callback`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code }),
			});
			const data = await res.json();
			const parsed = v.parse(ApiResponseSchema(v.string()), data);
			if (!parsed.data) {
				return null;
			}

			localStorage.setItem("github_token", parsed.data);
			await navigate({ to: "/repositories" });
			return data;
		},
		enabled: !!code,
		staleTime: 5 * 60 * 1000,
	});

	return (
		<div className="flex min-h-screen items-center justify-center">
			<p>Authenticating...</p>
		</div>
	);
}
