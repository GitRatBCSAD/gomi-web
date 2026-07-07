import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { JSX } from "react/jsx-runtime";

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
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

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
					<div className="relative" ref={dropdownRef}>
						<button
							onClick={() => setDropdownOpen(!dropdownOpen)}
							className="flex items-center gap-2.5 rounded-md px-2 py-1 border border-transparent hover:border-white/10 hover:bg-white/5 transition-all outline-none cursor-pointer"
							aria-label="User menu"
						>
							{userProfile?.avatarUrl ? (
								<img
									src={userProfile.avatarUrl}
									alt={userProfile.githubUsername}
									className="size-12 rounded-full border border-primary/20"
								/>
							) : (
								<div className="size-8 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-fira-mono-bold text-xs">
									{userProfile?.githubUsername?.[0]?.toUpperCase() || "U"}
								</div>
							)}
							<span className="text-muted-foreground font-fira-mono text-sm hidden md:inline">
								{userProfile?.githubUsername}
							</span>
						</button>

						{dropdownOpen && (
							<div className="absolute right-0 mt-2 w-32 rounded-lg border border-white/10 bg-[#0b0d10] p-1 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-100 z-50">
								<button
									disabled={logoutMutation.isPending}
									onClick={() => {
										setDropdownOpen(false);
										logoutMutation.mutate();
									}}
									className="w-full flex items-center justify-center px-3 py-2 text-center text-xs font-fira-mono text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer outline-none border-none"
								>
									{logoutMutation.isPending ? "Logging out..." : "Logout"}
								</button>
							</div>
						)}
					</div>
				)}
			</nav>
	);
}

