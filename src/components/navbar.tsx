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
		<nav className="fixed top-0 left-0 right-0 z-999 flex h-[4.5rem] items-center justify-between border-b border-primary-500 bg-dark-500/90 px-6 backdrop-blur-sm">
				<Link
					to={isAuthenticated ? "/repositories" : "/"}
					className="text-white font-fira-mono-bold text-3xl tracking-tighter no-underline transition-colors"
				>
					GO<span className="text-primary">MI</span>
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

