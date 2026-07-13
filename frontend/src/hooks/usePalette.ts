import { useState, useEffect } from "react";
import type { ClassInfo, PaletteResponse } from "../types/dataset";
import { API_BASE } from "../config";

/** Global cache outside React to survive remounts. */
let cachedPalette: ClassInfo[] | null = null;

export function usePalette() {
	const [palette, setPalette] = useState<ClassInfo[]>(cachedPalette ?? []);
	const [loading, setLoading] = useState(!cachedPalette);

	useEffect(() => {
		if (cachedPalette) {
			setPalette(cachedPalette);
			setLoading(false);
			return;
		}

		let cancelled = false;
		fetch(`${API_BASE}/palette`)
			.then((res) => res.json())
			.then((json: PaletteResponse) => {
				if (!cancelled) {
					cachedPalette = json.class_palette;
					setPalette(json.class_palette);
					setLoading(false);
				}
			})
			.catch(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	/** Build a Map<id, color> for fast pixel lookup. */
	const colorMap = new Map<number, [number, number, number]>();
	for (const cls of palette) {
		colorMap.set(cls.id, cls.color);
	}

	return { palette, colorMap, loading };
}
