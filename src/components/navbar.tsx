import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { JSX } from "react/jsx-runtime";

import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/lib/env";

export interface UserProfile {
	userId: string;
	name: string;
	githubUsername: string;
	avatarUrl: string;
}

export function Navbar(): JSX.Element {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { data: userProfile } = useQuery<UserProfile | null>({
		queryKey: ["authMe"],
		queryFn: async () => {
			try {
				const res = await fetch(`${BACKEND_URL}/auth/me`, { credentials: "include" });
				if (!res.ok) return null;
				const body = await res.json();
				return body.data;
			} catch {
				return null;
			}
		},
		staleTime: 60 * 1000,
	});

	const isAuthenticated = !!userProfile;

	const logoutMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch(`${BACKEND_URL}/auth/logout`, {
				method: "POST",
				credentials: "include",
			});
			if (!res.ok) throw new Error("Logout failed");
		},
		onSuccess: async () => {
			queryClient.setQueryData(["authMe"], null);
			await navigate({ to: "/" });
			queryClient.clear();
		},
	});

	return (
		<nav className="fixed top-0 left-0 right-0 z-999 flex h-[4.5rem] items-center justify-between border-b border-white/10 bg-[#0b0d10]/90 px-6 backdrop-blur-sm">
				<Link
					to={isAuthenticated ? "/repositories" : "/"}
					className="text-white hover:text-primary font-fira-mono-bold text-2xl tracking-tighter no-underline transition-colors"
				>
					GO<span className="text-primary">MI</span>
				</Link>

				{isAuthenticated && (
					<div className="flex items-center gap-4">
						{userProfile?.avatarUrl && (
							<img
								src={userProfile.avatarUrl}
								alt={userProfile.githubUsername}
								className="size-8 rounded-full border border-primary/20"
							/>
						)}
						<span className="text-muted-foreground font-fira-mono text-sm hidden md:inline">
							{userProfile?.githubUsername}
						</span>
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

