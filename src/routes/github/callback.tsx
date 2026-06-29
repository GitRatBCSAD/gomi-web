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
	const search = Route.useSearch();

	useQuery({
		queryKey: ["auth", search.code],
		queryFn: async () => {
			const res = await fetch(`${BACKEND_URL}/auth/callback`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ code: search.code }),
			});
			const data = await res.json();
			v.parse(ApiResponseSchema(), data);
			if (!res.ok) return null;
			await navigate({ to: "/repositories" });
			return data;
		},
		enabled: !!search.code,
		staleTime: 5 * 60 * 1000,
	});

	return (
		<div className="flex min-h-screen items-center justify-center">
			<p>Authenticating...</p>
		</div>
	);
}
