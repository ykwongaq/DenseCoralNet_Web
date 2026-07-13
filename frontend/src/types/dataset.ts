/** Color palette entry for a single class. */
export interface ClassInfo {
	id: number;
	name: string;
	color: [number, number, number]; // [R, G, B]
}

/** A single dataset item (image + mask pair). */
export interface DataItem {
	id: number;
	image_filename: string;
	mask_filename: string;
	image_url: string;
	mask_url: string;
	width: number;
	height: number;
	class_ids: number[];
	/** Display labels computed from remapped indices (index 0 = "Background", 1+ = "Class N"). */
	classLabels: string[];
}

/** Response from GET /api/dataset */
export interface DatasetResponse {
	total: number;
	offset: number;
	limit: number;
	data: DataItem[];
	class_palette: ClassInfo[];
}

/** Response from GET /api/palette */
export interface PaletteResponse {
	class_palette: ClassInfo[];
}
