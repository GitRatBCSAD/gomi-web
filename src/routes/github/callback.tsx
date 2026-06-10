import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/github/callback")({
	validateSearch: (search: Record<string, unknown>) => ({
		code: search.code as string | undefined,
	}),
	component: Callback,
});

function Callback() {
	const navigate = useNavigate();
	const { code } = Route.useSearch();

	useQuery({
		queryKey: ["auth", code],
		queryFn: async () => {
			const res = await fetch("http://localhost:3002/auth/callback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code }),
			});
			const data = await res.json();
			localStorage.setItem("github_token", data.access_token);
			await navigate({ to: "/repos" });
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
