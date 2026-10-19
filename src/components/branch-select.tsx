import { useQuery } from "@tanstack/react-query";
import { GitBranchIcon } from "lucide-react";
import type { JSX } from "react";

import { getBranchesQueryOptions } from "@/lib/github/api";
import { cn } from "@/lib/utils";

export function BranchSelect(props: {
	fullName: string;
	value: string | null;
	onChange: (branch: string, analyzed: boolean) => void;
	disabled?: boolean;
	className?: string;
}): JSX.Element {
	const { data, isLoading, isError } = useQuery(getBranchesQueryOptions(props.fullName));
	const branches = data?.branches ?? [];
	const value = props.value ?? data?.defaultBranch ?? "";

	return (
		<label
			className={cn(
				"border-input bg-background focus-within:ring-ring flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm focus-within:ring-1",
				props.className,
			)}
		>
			<GitBranchIcon className="text-muted-foreground size-3.5 shrink-0" />
			<span className="sr-only">Branch</span>
			<select
				className="text-foreground min-w-0 flex-1 bg-transparent outline-none"
				value={value}
				disabled={props.disabled || isLoading || isError}
				onChange={(e) => {
					const picked = branches.find((b) => b.name === e.target.value);
					if (picked) props.onChange(picked.name, picked.analyzed);
				}}
			>
				{isLoading && <option value={value}>Loading branches...</option>}
				{isError && <option value={value}>{value || "Branches unavailable"}</option>}
				{branches.map((b) => (
					<option key={b.name} value={b.name}>
						{b.name}
						{b.name === data?.defaultBranch ? " (default)" : ""}
						{b.analyzed ? " · analyzed" : ""}
					</option>
				))}
			</select>
		</label>
	);
}
