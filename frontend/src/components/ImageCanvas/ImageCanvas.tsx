import { useRef, useEffect } from "react";
import type { ClassInfo } from "../../types/dataset";
import styles from "./ImageCanvas.module.css";

interface Props {
	imageUrl: string;
	maskUrl: string;
	palette: ClassInfo[];
	width: number;
	height: number;
	alpha?: number; // overlay opacity, 0-1
	showMask?: boolean; // if false, only draw the original image
}

export default function ImageCanvas({
	imageUrl,
	maskUrl,
	palette,
	width,
	height,
	alpha = 0.5,
	showMask = true,
}: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !width || !height) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Build color lookup map
		const colorMap = new Map<number, [number, number, number]>();
		for (const cls of palette) {
			colorMap.set(cls.id, cls.color);
		}

		const baseImage = new Image();
		baseImage.crossOrigin = "anonymous";
		baseImage.src = imageUrl;

		baseImage.onload = () => {
			canvas.width = width;
			canvas.height = height;

			// Draw base image
			ctx.drawImage(baseImage, 0, 0, width, height);

			// If mask is disabled, stop here
			if (!showMask) return;

			// Draw mask overlay on a temp canvas to get pixel data
			const maskImage = new Image();
			maskImage.crossOrigin = "anonymous";
			maskImage.src = maskUrl;

			maskImage.onload = () => {
				const tmpCanvas = document.createElement("canvas");
				tmpCanvas.width = width;
				tmpCanvas.height = height;
				const tmpCtx = tmpCanvas.getContext("2d");
				if (!tmpCtx) return;

				tmpCtx.drawImage(maskImage, 0, 0, width, height);
				const imageData = tmpCtx.getImageData(0, 0, width, height);
				const pixels = imageData.data;

				// Create overlay ImageData
				const overlay = ctx.createImageData(width, height);
				const overlayPixels = overlay.data;

				for (let i = 0; i < pixels.length; i += 4) {
					const r = pixels[i];
					// const g = pixels[i + 1];
					// const b = pixels[i + 2];

					// Grayscale mask: all channels are the same value (class ID)
					const classId = r; // same as g and b for grayscale PNGs

					const color = colorMap.get(classId);
					if (color && classId !== 0) {
						overlayPixels[i] = color[0];
						overlayPixels[i + 1] = color[1];
						overlayPixels[i + 2] = color[2];
						overlayPixels[i + 3] = Math.round(alpha * 255);
					}
				}

				// Composite overlay onto main canvas with proper alpha blending
				// (putImageData replaces pixels; we must use drawImage to blend)
				const overlayCanvas = document.createElement("canvas");
				overlayCanvas.width = width;
				overlayCanvas.height = height;
				const overlayCtx = overlayCanvas.getContext("2d");
				if (overlayCtx) {
					overlayCtx.putImageData(overlay, 0, 0);
					ctx.drawImage(overlayCanvas, 0, 0);
				}
			};
		};
	}, [imageUrl, maskUrl, palette, width, height, alpha, showMask]);

	return (
		<canvas
			ref={canvasRef}
			className={styles.canvas}
			style={{ maxWidth: "100%", height: "auto" }}
		/>
	);
}
