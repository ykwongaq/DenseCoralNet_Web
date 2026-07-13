import { useState, useEffect, useCallback } from "react";
import type { DataItem, DatasetResponse } from "../types/dataset";
import { API_BASE } from "../config";

export function useDataset(initialOffset = 0, limit = 100) {
	const [data, setData] = useState<DataItem[]>([]);
	const [total, setTotal] = useState(0);
	const [offset, setOffset] = useState(initialOffset);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchPage = useCallback(
		async (newOffset: number) => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(
					`${API_BASE}/dataset?offset=${newOffset}&limit=${limit}`,
				);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const json: DatasetResponse = await res.json();
				// Compute display labels once per item
				const enriched = json.data.map((item) => ({
					...item,
					classLabels: item.class_ids.map((_, i) =>
						i === 0 ? "Background" : `Class ${i}`,
					),
				}));
				setData(enriched);
				setTotal(json.total);
				setOffset(newOffset);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setLoading(false);
			}
		},
		[limit],
	);

	useEffect(() => {
		fetchPage(initialOffset);
	}, [fetchPage, initialOffset]);

	const goToPage = (newOffset: number) => {
		if (newOffset >= 0 && newOffset < total) {
			fetchPage(newOffset);
		}
	};

	const nextItem = () => goToPage(offset + 1);
	const prevItem = () => goToPage(offset - 1);

	return {
		currentItem: data.length > 0 ? data[0] : null,
		allItems: data,
		total,
		offset,
		loading,
		error,
		goToPage,
		nextItem,
		prevItem,
		hasNext: offset + 1 < total,
		hasPrev: offset > 0,
	};
}
