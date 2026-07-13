import type { DataItem } from "../../types/dataset";
import styles from "./ImageInfo.module.css";

interface Props {
	item: DataItem | null;
	loading: boolean;
}

export default function ImageInfo({ item, loading }: Props) {
	if (loading) {
		return <div className={styles.info}>Loading...</div>;
	}

	if (!item) {
		return <div className={styles.info}>No data</div>;
	}

	return (
		<div className={styles.info}>
			<div className={styles.row}>
				<span className={styles.key}>File</span>
				<span className={styles.value} title={item.image_filename}>
					{item.image_filename}
				</span>
			</div>
			<div className={styles.row}>
				<span className={styles.key}>Size</span>
				<span className={styles.value}>
					{item.width} × {item.height}
				</span>
			</div>
			<div className={styles.row}>
				<span className={styles.key}>Classes</span>
				<span className={styles.value}>
					{item.classLabels.length > 0 ? item.classLabels.join(", ") : "—"}
				</span>
			</div>
		</div>
	);
}
