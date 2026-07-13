import { useState, useEffect, useCallback, useRef } from "react";
import type { DataItem, DatasetResponse } from "../types/dataset";
import { API_BASE } from "../config";
const PAGE_SIZE = 100;

export function useImageList() {
	const [items, setItems] = useState<DataItem[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(true);
	const loadingRef = useRef(false);

	const fetchPage = useCallback(async (offset: number) => {
		if (loadingRef.current) return;
		loadingRef.current = true;
		setLoading(true);
		setError(null);

		try {
			const res = await fetch(
				`${API_BASE}/dataset?offset=${offset}&limit=${PAGE_SIZE}`,
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json: DatasetResponse = await res.json();

			setItems((prev) => [...prev, ...json.data]);
			setTotal(json.total);
			setHasMore(offset + PAGE_SIZE < json.total);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
			loadingRef.current = false;
		}
	}, []);

	// Load first page on mount
	useEffect(() => {
		fetchPage(0);
	}, [fetchPage]);

	const loadMore = useCallback(() => {
		if (!loadingRef.current && hasMore) {
			fetchPage(items.length);
		}
	}, [fetchPage, hasMore, items.length]);

	return { items, total, loading, error, hasMore, loadMore };
}
