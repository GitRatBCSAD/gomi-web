import { useEffect, useState } from "react";

import { H1, P } from "@/components/typography";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const STEP_MESSAGES: Record<string, string> = {
	queued: "Waiting for a free worker...",
	cloning: "Downloading the repository...",
	extracting_git: "Reading the last 6 months of changes...",
	scanning_complexity: "Measuring how complex the code is...",
	scoring_files: "Estimating risk for each file...",
	done: "Finalizing...",
};

// Short labels for buttons; shared by the repository list and overview pages.
const STEP_LABELS: Record<string, string> = {
	queued: "Queued...",
	cloning: "Downloading...",
	extracting_git: "Reading history...",
	scanning_complexity: "Measuring...",
	scoring_files: "Scoring...",
};

export function stepLabel(step: string): string {
	return STEP_LABELS[step] ?? "Analyzing...";
}

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
				<Spinner className="text-primary size-10" />

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
