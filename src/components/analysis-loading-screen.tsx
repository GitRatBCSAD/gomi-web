import { useEffect, useState } from "react";

import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { H1, P } from "@/components/typography";
import { cn } from "@/lib/utils";

const STEP_MESSAGES: Record<string, string> = {
	queued: "Waiting in queue...",
	cloning: "Cloning repository...",
	extracting_git: "Extracting git history...",
	scanning_complexity: "Scanning code complexity...",
	scoring_files: "Scoring files for risk...",
	done: "Finalizing...",
};

interface AnalysisLoadingScreenProps {
	repoFullName: string;
	step: string;
	progress: number;
	currentFile?: string;
	visible: boolean;
}

export function AnalysisLoadingScreen({
	repoFullName,
	step,
	progress,
	currentFile,
	visible,
}: AnalysisLoadingScreenProps) {
	// Smooth animated file path — avoid flicker on rapid changes
	const [displayedFile, setDisplayedFile] = useState(currentFile ?? "");
	const [fileVisible, setFileVisible] = useState(false);

	useEffect(() => {
		if (!currentFile) {
			setFileVisible(false);
			return;
		}
		// Fade out → swap → fade in
		setFileVisible(false);
		const swap = setTimeout(() => {
			setDisplayedFile(currentFile);
			setFileVisible(true);
		}, 150);
		return () => clearTimeout(swap);
	}, [currentFile]);

	const pct = Math.round(progress * 100);
	const message = STEP_MESSAGES[step] ?? "Analyzing...";
	const [owner, name] = repoFullName.split("/");

	return (
		<div
			className={cn(
				"fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300",
				"bg-background",
				visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
			)}
		>
			{/* Grid overlay — matches app aesthetic */}
			<div
				className="absolute inset-0 opacity-[0.04]"
				style={{
					backgroundImage:
						"linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
					backgroundSize: "48px 48px",
				}}
			/>

			<div className="relative flex w-full max-w-md flex-col items-center gap-8 px-6 text-center">
				{/* Spinner */}
				<Spinner className="size-10 text-primary" />

				{/* Title */}
				<div className="flex flex-col gap-1">
					<H1 variant="h4">
						Analyzing{" "}
						<span className="text-primary">
							{owner}/{name}
						</span>
					</H1>
				</div>

				{/* Step message */}
				<P className="text-muted-foreground text-sm tracking-widest uppercase">{message}</P>

				{/* Progress bar */}
				<Progress value={pct} className="w-full" />
				<P className="text-muted-foreground text-sm tabular-nums">{pct}%</P>

				{/* Current file — only during scoring_files step */}
				<div className="h-5 w-full overflow-hidden">
					<P
						className={cn(
							"text-muted-foreground truncate text-center text-sm transition-opacity duration-150",
							fileVisible ? "opacity-100" : "opacity-0",
						)}
					>
						{displayedFile}
					</P>
				</div>
			</div>
		</div>
	);
}
