import type { ClassInfo } from "../../types/dataset";
import styles from "./ClassLegend.module.css";

interface Props {
	palette: ClassInfo[];
	activeClassIds: number[]; // classes present in current image
}

export default function ClassLegend({ palette, activeClassIds }: Props) {
	const activeSet = new Set(activeClassIds);

	return (
		<div className={styles.legend}>
			<h3 className={styles.title}>Classes</h3>
			<div className={styles.list}>
				{palette.map((cls) => {
					const isActive = activeSet.has(cls.id);
					const [r, g, b] = cls.color;
					return (
						<div
							key={cls.id}
							className={`${styles.item} ${isActive ? styles.active : styles.inactive}`}
						>
							<span
								className={styles.swatch}
								style={{ backgroundColor: `rgb(${r},${g},${b})` }}
							/>
							<span className={styles.label}>
								{cls.name}
								{cls.id === 0 ? "" : ` (${cls.id})`}
							</span>
							{!isActive && cls.id !== 0 && (
								<span className={styles.absent}>—</span>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
