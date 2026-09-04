import { HelpCircleIcon } from "lucide-react";
import type { JSX } from "react";

export function TourTriggerButton({ onClick }: { onClick: () => void }): JSX.Element {
	return (
		<button
			type="button"
			onClick={onClick}
			className="border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors"
		>
			<HelpCircleIcon className="size-3.5" />
			<span>Tour</span>
		</button>
	);
}
