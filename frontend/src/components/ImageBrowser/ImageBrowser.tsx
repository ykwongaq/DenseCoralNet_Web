import { useEffect, useRef, useCallback } from "react";
import { useImageList } from "../../hooks/useImageList";
import type { DataItem } from "../../types/dataset";
import styles from "./ImageBrowser.module.css";

interface Props {
	onSelectImage: (item: DataItem) => void;
}

export default function ImageBrowser({ onSelectImage }: Props) {
	const { items, total, loading, error, hasMore, loadMore } = useImageList();
	const sentinelRef = useRef<HTMLDivElement>(null);

	// IntersectionObserver for infinite scroll
	const observerCallback = useCallback(
		(entries: IntersectionObserverEntry[]) => {
			if (entries[0].isIntersecting && hasMore && !loading) {
				loadMore();
			}
		},
		[hasMore, loading, loadMore],
	);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(observerCallback, {
			rootMargin: "200px",
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [observerCallback]);

	if (error) {
		return (
			<div className={styles.container}>
				<div className={styles.error}>
					<p>Failed to load images.</p>
					<p className={styles.errorDetail}>{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h1 className={styles.title}>DenseCoralNet — Image Browser</h1>
				<span className={styles.count}>
					{total > 0
						? `${items.length.toLocaleString()} / ${total.toLocaleString()} images`
						: "Loading..."}
				</span>
			</header>

			{items.length === 0 && loading ? (
				<div className={styles.loading}>Loading images...</div>
			) : items.length === 0 ? (
				<div className={styles.empty}>No images found.</div>
			) : (
				<>
					<div className={styles.grid}>
						{items.map((item) => (
							<button
								key={item.id}
								className={styles.card}
								onClick={() => onSelectImage(item)}
								title={item.image_filename}
							>
								<img
									className={styles.thumbnail}
									src={item.image_url}
									alt={item.image_filename}
									loading="lazy"
								/>
								<span className={styles.cardIndex}>#{item.id}</span>
							</button>
						))}
					</div>

					{loading && <div className={styles.loading}>Loading more...</div>}

					{!hasMore && items.length > 0 && (
						<div className={styles.loading}>
							All {total.toLocaleString()} images loaded.
						</div>
					)}

					<div ref={sentinelRef} className={styles.sentinel} />
				</>
			)}
		</div>
	);
}
