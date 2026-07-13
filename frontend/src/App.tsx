import { useState, useCallback } from "react";
import ImageBrowser from "./components/ImageBrowser/ImageBrowser";
import SegmentationViewer from "./components/SegmentationViewer/SegmentationViewer";
import type { DataItem } from "./types/dataset";

export default function App() {
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const handleSelectImage = useCallback((item: DataItem) => {
		setSelectedId(item.id);
	}, []);

	const handleBack = useCallback(() => {
		setSelectedId(null);
	}, []);

	if (selectedId !== null) {
		return <SegmentationViewer imageId={selectedId} onBack={handleBack} />;
	}

	return <ImageBrowser onSelectImage={handleSelectImage} />;
}
