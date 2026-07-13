import { useEffect, useCallback, useState } from "react";
import { useDataset } from "../../hooks/useDataset";
import { usePalette } from "../../hooks/usePalette";
import ImageCanvas from "../ImageCanvas/ImageCanvas";
import ClassLegend from "../ClassLegend/ClassLegend";
import NavigationBar from "../NavigationBar/NavigationBar";
import ImageInfo from "../ImageInfo/ImageInfo";
import styles from "./SegmentationViewer.module.css";

interface Props {
	imageId?: number;
	onBack?: () => void;
}

export default function SegmentationViewer({ imageId = 0, onBack }: Props) {
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
	} = useDataset(imageId, 1); // fetch one item at a time, start at imageId

	const { palette, loading: paletteLoading } = usePalette();

	// Alpha slider for mask overlay opacity
	const [alpha, setAlpha] = useState(0.5);

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
				<div className={styles.headerLeft}>
					{onBack && (
						<button
							className={styles.backBtn}
							onClick={onBack}
							title="Back to image browser"
						>
							← Back to Browser
						</button>
					)}
					<h1 className={styles.title}>
						DenseCoralNet — Semantic Segmentation Viewer
					</h1>
				</div>
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
						<div className={styles.comparison}>
							<div className={styles.pane}>
								<ImageCanvas
									imageUrl={currentItem.image_url}
									maskUrl={currentItem.mask_url}
									palette={palette}
									width={currentItem.width}
									height={currentItem.height}
									showMask={false}
								/>
								<span className={styles.paneLabel}>Original</span>
							</div>
							<div className={styles.arrow}>→</div>
							<div className={styles.pane}>
								<ImageCanvas
									imageUrl={currentItem.image_url}
									maskUrl={currentItem.mask_url}
									palette={palette}
									width={currentItem.width}
									height={currentItem.height}
									alpha={alpha}
								/>
								<span className={styles.paneLabel}>DenseCoralNet Result</span>
								<div className={styles.alphaControl}>
									<label className={styles.alphaLabel}>
										Opacity: {Math.round(alpha * 100)}%
									</label>
									<input
										type="range"
										min={0}
										max={1}
										step={0.05}
										value={alpha}
										onChange={(e) => setAlpha(parseFloat(e.target.value))}
										className={styles.alphaSlider}
									/>
								</div>
							</div>
						</div>
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
							classLabels={currentItem?.classLabels ?? []}
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
