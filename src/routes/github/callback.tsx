import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
	const queryClient = useQueryClient();
	const hasFired = useRef(false);

	useEffect(() => {
		if (hasFired.current || !search.code) return;
		hasFired.current = true;

		async function exchangeCode() {
			try {
				const res = await fetch(`${BACKEND_URL}/auth/callback`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ code: search.code }),
				});
				if (!res.ok) {
					console.error("Auth callback failed:", res.statusText);
					await navigate({ to: "/" });
					return;
				}
				const data = await res.json();
				
				v.parse(ApiResponseSchema(v.object({ isNewUser: v.boolean() })), data);
				
				await queryClient.fetchQuery({
					queryKey: ["authMe"],
					queryFn: async () => {
						const res = await fetch(`${BACKEND_URL}/auth/me`, { credentials: "include" });
						if (!res.ok) return null;
						const body = await res.json();
						return body.data;
					}
				});

				await navigate({ to: "/repositories" });
			} catch (err) {
				console.error("Auth callback error:", err);
				await navigate({ to: "/" });
			}
		}

		exchangeCode();
	}, [search.code, queryClient, navigate]);

	return (
		<div className="flex flex-1 items-center justify-center min-h-[60vh]">
			<p className="text-muted-foreground font-fira-mono text-sm tracking-widest uppercase animate-pulse">
				Authenticating...
			</p>
		</div>
	);
}
