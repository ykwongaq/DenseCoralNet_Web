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

	return (
		<div className={styles.legend}>
			<h3 className={styles.title}>Classes ({activeClassIds.length})</h3>
			<div className={styles.list}>
				{activeClassIds.map((id, i) => {
					const cls = paletteMap.get(id);
					if (!cls) return null;
					const [r, g, b] = cls.color;
					return (
						<div key={id} className={styles.item}>
							<span
								className={styles.swatch}
								style={{ backgroundColor: `rgb(${r},${g},${b})` }}
							/>
							<span className={styles.label}>{classLabels[i]}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
