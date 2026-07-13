import { useState, useEffect } from "react";
import styles from "./NavigationBar.module.css";

interface Props {
	offset: number;
	total: number;
	onPrev: () => void;
	onNext: () => void;
	onGoTo: (index: number) => void;
	hasPrev: boolean;
	hasNext: boolean;
}

export default function NavigationBar({
	offset,
	total,
	onPrev,
	onNext,
	onGoTo,
	hasPrev,
	hasNext,
}: Props) {
	const [inputValue, setInputValue] = useState(String(offset));

	// Sync input value when offset changes externally (prev/next clicks)
	useEffect(() => {
		setInputValue(String(offset));
	}, [offset]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			const val = parseInt(inputValue, 10);
			if (!isNaN(val) && val >= 0 && val < total) {
				onGoTo(val);
			}
		}
	};

	return (
		<div className={styles.nav}>
			<button
				className={styles.btn}
				onClick={onPrev}
				disabled={!hasPrev}
				title="Previous (← arrow key)"
			>
				← Prev
			</button>

			<div className={styles.center}>
				<input
					className={styles.input}
					type="number"
					min={0}
					max={total - 1}
					value={inputValue}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					aria-label="Go to index"
				/>
				<span className={styles.total}>/ {total.toLocaleString()}</span>
			</div>

			<button
				className={styles.btn}
				onClick={onNext}
				disabled={!hasNext}
				title="Next (→ arrow key)"
			>
				Next →
			</button>
		</div>
	);
}
