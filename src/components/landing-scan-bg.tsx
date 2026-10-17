import { useEffect, useRef, type JSX } from "react";

import { useTheme } from "@/lib/theme";

type Tile = {
	x: number;
	y: number;
	w: number;
	h: number;
	heat: number;
	phase: number;
	speed: number;
};

const SCAN_PERIOD = 7; // seconds for one left-to-right sweep
const GAP = 6;

function buildTiles(w: number, h: number): Tile[] {
	const tiles: Tile[] = [];
	const ncols = Math.max(5, Math.round(w / 96));
	const cw = w / ncols;
	for (let c = 0; c < ncols; c++) {
		let y = 0;
		while (y < h) {
			const rh = 44 + Math.random() * 96;
			tiles.push({
				x: c * cw,
				y,
				w: cw,
				h: Math.min(rh, h - y),
				heat: Math.random(),
				phase: Math.random() * Math.PI * 2,
				speed: 0.25 + Math.random() * 0.5,
			});
			y += rh;
		}
	}
	return tiles;
}

// green -> amber -> red, tuned per theme
function heatColor(t: number, dark: boolean): [number, number, number] {
	const stops: [number, [number, number, number]][] = dark
		? [
				[0, [22, 120, 90]],
				[0.5, [180, 140, 40]],
				[1, [200, 70, 60]],
			]
		: [
				[0, [22, 163, 74]],
				[0.5, [217, 168, 10]],
				[1, [220, 38, 38]],
			];
	let lo = stops[0];
	let hi = stops[stops.length - 1];
	for (let i = 0; i < stops.length - 1; i++) {
		if (t >= stops[i][0] && t <= stops[i + 1][0]) {
			lo = stops[i];
			hi = stops[i + 1];
			break;
		}
	}
	const k = hi[0] === lo[0] ? 0 : (t - lo[0]) / (hi[0] - lo[0]);
	return [0, 1, 2].map((i) => Math.round(lo[1][i] + (hi[1][i] - lo[1][i]) * k)) as [
		number,
		number,
		number,
	];
}

export function LandingScanBg(): JSX.Element {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const { theme } = useTheme();

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dark = theme === "dark";
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let tiles: Tile[] = [];
		let w = 0;
		let h = 0;
		let raf = 0;

		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			w = canvas.clientWidth;
			h = canvas.clientHeight;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			tiles = buildTiles(w, h);
		};

		const draw = (ms: number) => {
			const t = ms / 1000;
			const scanBand = w * 0.16;
			const scanX = ((t / SCAN_PERIOD) % 1) * (w + scanBand * 2) - scanBand;
			ctx.clearRect(0, 0, w, h);

			for (const tile of tiles) {
				const osc = reduce ? 0 : 0.14 * Math.sin(t * tile.speed + tile.phase);
				const cx = tile.x + tile.w / 2;
				const dist = Math.abs(cx - scanX);
				const boost = reduce ? 0 : dist < scanBand ? 1 - dist / scanBand : 0;
				const heat = Math.min(1, Math.max(0, tile.heat + osc + boost * 0.35));
				const [r, g, b] = heatColor(heat, dark);
				const alpha = 0.16 + boost * 0.5;
				ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
				const x = tile.x + GAP / 2;
				const y = tile.y + GAP / 2;
				const rw = Math.max(0, tile.w - GAP);
				const rh = Math.max(0, tile.h - GAP);
				const rad = 5;
				ctx.beginPath();
				ctx.roundRect(x, y, rw, rh, rad);
				ctx.fill();
			}

			if (!reduce) {
				const grad = ctx.createLinearGradient(scanX - scanBand, 0, scanX + scanBand, 0);
				grad.addColorStop(0, "rgba(20,184,166,0)");
				grad.addColorStop(0.5, dark ? "rgba(20,184,166,0.10)" : "rgba(0,120,111,0.08)");
				grad.addColorStop(1, "rgba(20,184,166,0)");
				ctx.fillStyle = grad;
				ctx.fillRect(scanX - scanBand, 0, scanBand * 2, h);
				raf = requestAnimationFrame(draw);
			}
		};

		resize();
		const ro = new ResizeObserver(() => {
			resize();
			if (reduce) draw(0);
		});
		ro.observe(canvas);
		if (reduce) draw(0);
		else raf = requestAnimationFrame(draw);

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	}, [theme]);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 -z-20 h-full w-screen left-1/2 -translate-x-1/2"
			style={{
				maskImage:
					"radial-gradient(ellipse 75% 85% at 50% 92%, #000 0%, rgba(0,0,0,0.55) 45%, transparent 80%)",
				WebkitMaskImage:
					"radial-gradient(ellipse 75% 85% at 50% 92%, #000 0%, rgba(0,0,0,0.55) 45%, transparent 80%)",
			}}
		/>
	);
}
