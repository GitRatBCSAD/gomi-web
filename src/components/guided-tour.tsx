import { Tour, useTour, type TourStepDetails } from "@ark-ui/react";
import { XIcon } from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import { createPortal } from "react-dom";

const ENDED = ["completed", "dismissed", "skipped"];

export function GuidedTour({
	steps,
	onDone,
}: {
	steps: TourStepDetails[];
	onDone: () => void;
}): JSX.Element | null {
	const tour = useTour({
		steps,
		closeOnInteractOutside: false,
		onStatusChange: (details) => {
			if (ENDED.includes(details.status)) onDone();
		},
	});

	useEffect(() => {
		tour.start();
	}, []);

	const [pageHeight, setPageHeight] = useState(0);

	useEffect(() => {
		if (!tour.open) return;
		setPageHeight(document.documentElement.scrollHeight);
	}, [tour.open, tour.step?.id]);

	if (!tour.open) return null;

	return createPortal(
		<Tour.Root tour={tour}>
			<Tour.Backdrop
				className="pointer-events-none fixed inset-0 z-[999] bg-black/70"
				style={
					tour.step?.type === "tooltip"
						? { position: "absolute", bottom: "auto", height: `${pageHeight}px` }
						: undefined
				}
			/>
			<Tour.Spotlight className="ring-primary/60 rounded-lg ring-2" />
			<Tour.Positioner
				className={
					tour.step?.type === "dialog"
						? "fixed inset-0 z-[1000] flex items-center justify-center p-4"
						: "z-[1000]"
				}
			>
				<Tour.Content className="bg-background-900 border-border/60 font-fira-mono text-foreground relative flex w-[min(92vw,26rem)] flex-col gap-3 rounded-2xl border p-6 text-sm leading-relaxed shadow-2xl">
					<Tour.Title className="font-fira-mono-bold text-primary pr-6 text-lg">
						{tour.step?.title}
					</Tour.Title>
					<Tour.Description className="text-foreground/90 text-sm leading-relaxed">
						{tour.step?.description}
					</Tour.Description>

					<div className="mt-1 flex items-center justify-between gap-3">
						<Tour.ProgressText className="text-muted-foreground text-xs tabular-nums" />
						<div className="flex items-center gap-2">
							{tour.step?.actions?.map((a) => (
								<Tour.ActionTrigger
									key={a.label}
									action={a}
									className={
										a.action === "next"
											? "bg-primary hover:bg-primary/90 cursor-pointer rounded-md px-3 py-1.5 text-xs font-bold text-black transition-colors"
											: "border-border/50 text-muted-foreground hover:text-foreground cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors"
									}
								/>
							))}
						</div>
					</div>

					<Tour.CloseTrigger
						aria-label="Close tour"
						className="text-muted-foreground hover:text-foreground absolute top-4 right-4 cursor-pointer transition-colors"
					>
						<XIcon className="size-4" />
					</Tour.CloseTrigger>

					{tour.step?.type === "tooltip" && (
						<Tour.Arrow>
							<Tour.ArrowTip className="border-border/40 border" />
						</Tour.Arrow>
					)}
				</Tour.Content>
			</Tour.Positioner>
		</Tour.Root>,
		document.body,
	);
}
