import { createFileRoute, redirect } from "@tanstack/react-router";
import { GithubIcon } from "lucide-react";

import { LandingScanBg } from "@/components/landing-scan-bg";
import { BACKEND_URL, CLIENT_URL, GITHUB_CLIENT_ID } from "@/lib/env";
import { H1, P } from "@/components/typography";

export const Route = createFileRoute("/")({
	component: Home,
	beforeLoad: async () => {
		const res = await fetch(`${BACKEND_URL}/auth/me`, { credentials: "include" });
		if (res.ok) throw redirect({ to: "/repositories" });
	},
});

function Home() {
	const redirectUri = `${CLIENT_URL}/github/callback`;
	const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo`;

	return (
		<div className="relative mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-6xl flex-1 flex-col items-center justify-center gap-5 px-6 py-8 text-center">
			<LandingScanBg />
			<div className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-full w-screen -translate-x-1/2">
				<div
					className="gomi-glow-breathe h-full w-full"
					style={{
						background:
							"radial-gradient(ellipse 80% 62% at 50% 100%, color-mix(in srgb, var(--primary) 65%, transparent) 0%, color-mix(in srgb, var(--primary) 28%, transparent) 42%, transparent 74%)",
					}}
				/>
			</div>
			<H1 className="gomi-rise-in text-7xl">
				Detect <span className="text-primary">Debt</span> Before It Breaks You
			</H1>
			<P
				className="gomi-rise-in"
				style={{ animationDelay: "90ms" }}
			>
				Analyze commit sentiment to uncover emotionally volatile code &mdash; the kind that
				breaks in production.
			</P>
			<a
				href={authUrl}
				className="gomi-rise-in bg-primary font-fira-mono-bold hover:bg-primary/90 text-primary-foreground mt-2 inline-flex w-full max-w-[52rem] cursor-pointer items-center justify-center gap-2.5 rounded-lg px-8 py-3.5 text-base font-bold no-underline transition-all duration-200"
				style={{ animationDelay: "180ms" }}
			>
				<GithubIcon className="size-5 shrink-0" />
				<span>Install Now</span>
			</a>
		</div>
	);
}
