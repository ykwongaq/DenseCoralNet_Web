import { useEffect, useCallback } from "react";
import type { ClassInfo } from "../../types/dataset";
import { useDataset } from "../../hooks/useDataset";
import { usePalette } from "../../hooks/usePalette";
import ImageCanvas from "../ImageCanvas/ImageCanvas";
import ClassLegend from "../ClassLegend/ClassLegend";
import NavigationBar from "../NavigationBar/NavigationBar";
import ImageInfo from "../ImageInfo/ImageInfo";
import styles from "./SegmentationViewer.module.css";

export default function SegmentationViewer() {
	const {
		currentItem,
		total,
		offset,
		loading,
		error,
		goToPage,
		nextItem,
		prevItem,
		hasNext,
		hasPrev,
	} = useDataset(0, 1); // fetch one item at a time

	const { palette, loading: paletteLoading } = usePalette();

	// Keyboard navigation
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "ArrowRight" && hasNext) nextItem();
			else if (e.key === "ArrowLeft" && hasPrev) prevItem();
		},
		[nextItem, prevItem, hasNext, hasPrev],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	if (error) {
		return (
			<div className={styles.container}>
				<div className={styles.error}>
					<p>Failed to load dataset.</p>
					<p className={styles.errorDetail}>{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h1 className={styles.title}>
					DenseCoralNet — Semantic Segmentation Viewer
				</h1>
				<span className={styles.count}>
					{loading ? "Loading..." : `${total.toLocaleString()} images`}
				</span>
			</header>

			<NavigationBar
				offset={offset}
				total={total}
				onPrev={prevItem}
				onNext={nextItem}
				onGoTo={goToPage}
				hasPrev={hasPrev}
				hasNext={hasNext}
			/>

			<div className={styles.main}>
				<div className={styles.canvasArea}>
					{loading && !currentItem ? (
						<div className={styles.loading}>Loading...</div>
					) : currentItem ? (
						<ImageCanvas
							imageUrl={currentItem.image_url}
							maskUrl={currentItem.mask_url}
							palette={palette}
							width={currentItem.width}
							height={currentItem.height}
							alpha={0.5}
						/>
					) : null}
					<ImageInfo item={currentItem} loading={loading} />
				</div>

				<aside className={styles.sidebar}>
					{paletteLoading ? (
						<div className={styles.loading}>Loading palette...</div>
					) : (
						<ClassLegend
							palette={palette}
							activeClassIds={currentItem?.class_ids ?? []}
						/>
					)}
				</aside>
			</div>

			<NavigationBar
				offset={offset}
				total={total}
				onPrev={prevItem}
				onNext={nextItem}
				onGoTo={goToPage}
				hasPrev={hasPrev}
				hasNext={hasNext}
			/>
		</div>
	);
}
