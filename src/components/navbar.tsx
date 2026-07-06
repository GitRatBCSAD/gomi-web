import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { JSX } from "react/jsx-runtime";

import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/lib/env";

export function Navbar(): JSX.Element {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { data: isAuthenticated } = useQuery({
		queryKey: ["authMe"],
		queryFn: async () => {
			try {
				const res = await fetch(`${BACKEND_URL}/auth/me`, { credentials: "include" });
				return res.ok;
			} catch {
				return false;
			}
		},
		staleTime: 60 * 1000,
	});

	const logoutMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch(`${BACKEND_URL}/auth/logout`, {
				method: "POST",
				credentials: "include",
			});
			if (!res.ok) throw new Error("Logout failed");
		},
		onSuccess: async () => {
			queryClient.setQueryData(["authMe"], false);
			await navigate({ to: "/" });
			queryClient.clear();
		},
	});

	return (
		<nav className="bg-dark-500/80 border-border/40 fixed top-0 left-0 right-0 z-999 flex h-18 items-center justify-between border-b px-6 backdrop-blur-md">
				<Link
					to={isAuthenticated ? "/repositories" : "/"}
					className="text-primary hover:text-primary-400 font-fira-mono-bold text-xl tracking-widest no-underline transition-colors"
				>
					GOMI
				</Link>

				{isAuthenticated && (
					<div className="flex items-center gap-6">
						<Button
							variant="destructive"
							size="sm"
							disabled={logoutMutation.isPending}
							onClick={() => logoutMutation.mutate()}
						>
							Logout
						</Button>
					</div>
				)}
			</nav>
	);
}

