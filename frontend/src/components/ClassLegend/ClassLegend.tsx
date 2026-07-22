import type { ClassInfo } from "../../types/dataset";
import styles from "./ClassLegend.module.css";

interface Props {
	palette: ClassInfo[];
	activeClassIds: number[]; // original class IDs present in current image
	classLabels: string[]; // pre-computed display labels (same length as activeClassIds)
}

export default function ClassLegend({
	palette,
	activeClassIds,
	classLabels,
}: Props) {
	// Build a lookup from original class ID to ClassInfo (for colors)
	const paletteMap = new Map<number, ClassInfo>();
	for (const cls of palette) {
		paletteMap.set(cls.id, cls);
	}

	// Filter out background class (id === 0)
	const visibleClassIds = activeClassIds.filter((id) => id !== 0);
	const visibleLabels = classLabels.filter((_, i) => activeClassIds[i] !== 0);

	return (
		<div className={styles.legend}>
			<h3 className={styles.title}>Classes ({visibleClassIds.length})</h3>
			<div className={styles.list}>
				{visibleClassIds.map((id, i) => {
					const cls = paletteMap.get(id);
					if (!cls) return null;
					const [r, g, b] = cls.color;
					return (
						<div key={id} className={styles.item}>
							<span
								className={styles.swatch}
								style={{ backgroundColor: `rgb(${r},${g},${b})` }}
							/>
							<span className={styles.label}>{visibleLabels[i]}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
