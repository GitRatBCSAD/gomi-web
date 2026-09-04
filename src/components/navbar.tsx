import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpenIcon, MoonIcon, SunIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { JSX } from "react/jsx-runtime";

import { BACKEND_URL } from "@/lib/env";
import { useTheme } from "@/lib/theme";

export interface UserProfile {
	userId: string;
	name: string;
	githubUsername: string;
	avatarUrl: string;
}

export function Navbar(): JSX.Element {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { theme, toggleTheme } = useTheme();
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
			for (const key of Object.keys(localStorage)) {
				if (key.startsWith("gomi:")) localStorage.removeItem(key);
			}
			await navigate({ to: "/" });
			queryClient.clear();
		},
	});

	return (
		<nav className="border-border bg-background/90 fixed top-0 right-0 left-0 z-999 flex h-[4.5rem] items-center justify-between border-b px-6 backdrop-blur-sm">
			<div className="flex items-center gap-6">
				<Link
					to={isAuthenticated ? "/repositories" : "/"}
					className="text-foreground font-fira-mono-bold flex items-center gap-2 text-2xl no-underline"
				>
					<svg
						viewBox="0 0 24 24"
						className="text-primary size-6"
						fill="currentColor"
						aria-hidden="true"
					>
						<rect x="3" y="3" width="8" height="8" rx="2" />
						<rect x="13" y="13" width="8" height="8" rx="2" />
					</svg>
					Gomi
				</Link>
				{isAuthenticated ? (
					<Link
						id="tour-guide"
						to="/guide"
						className="text-muted-foreground hover:text-primary font-fira-mono text-sm no-underline transition-colors"
						activeProps={{ className: "text-primary" }}
					>
						Guide
					</Link>
				) : (
					<Link
						id="tour-guide"
						to="/guide"
						className="border-border text-foreground hover:border-primary/50 hover:text-primary font-fira-mono flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm no-underline transition-colors"
						activeProps={{ className: "border-primary/50 text-primary" }}
					>
						<BookOpenIcon className="size-3.5" />
						Read the Guide
					</Link>
				)}
			</div>

			<div className="flex items-center gap-2">
				<button
					onClick={toggleTheme}
					className="hover:border-border hover:bg-muted flex cursor-pointer items-center justify-center rounded-md border border-transparent p-2 transition-all outline-none"
					aria-label="Toggle theme"
				>
					{theme === "dark" ? (
						<SunIcon className="text-foreground size-4" />
					) : (
						<MoonIcon className="text-foreground size-4" />
					)}
				</button>

				{isAuthenticated && (
					<div className="relative" ref={dropdownRef}>
						<button
							onClick={() => setDropdownOpen(!dropdownOpen)}
							className="hover:border-border hover:bg-muted flex cursor-pointer items-center gap-2.5 rounded-md border border-transparent px-2 py-1 transition-all outline-none"
							aria-label="User menu"
						>
							{userProfile?.avatarUrl ? (
								<img
									src={userProfile.avatarUrl}
									alt={userProfile.githubUsername}
									className="border-primary/20 size-12 rounded-full border"
								/>
							) : (
								<div className="border-primary/20 bg-primary/10 text-primary font-fira-mono-bold flex size-8 items-center justify-center rounded-full border text-xs">
									{userProfile?.githubUsername?.[0]?.toUpperCase() || "U"}
								</div>
							)}
							<span className="text-muted-foreground font-fira-mono hidden text-sm md:inline">
								{userProfile?.githubUsername}
							</span>
						</button>

						{dropdownOpen && (
							<div className="animate-in fade-in slide-in-from-top-1 border-border bg-popover absolute right-0 z-50 mt-2 w-32 rounded-lg border p-1 shadow-2xl duration-100">
								<button
									disabled={logoutMutation.isPending}
									onClick={() => {
										setDropdownOpen(false);
										logoutMutation.mutate();
									}}
									className="font-fira-mono text-destructive hover:bg-destructive/10 flex w-full cursor-pointer items-center justify-center rounded-md border-none px-3 py-2 text-center text-xs transition-colors outline-none"
								>
									{logoutMutation.isPending ? "Logging out..." : "Logout"}
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</nav>
	);
}
