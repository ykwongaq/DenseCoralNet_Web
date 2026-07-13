import concurrent.futures
import os
from typing import Dict, List, Tuple

import numpy as np
from PIL import Image

from .dataset import Data, Dataset
from .utils.path import resolve_path

# 20 soft, visually pleasing colors for segmentation overlay (avoiding pure primaries).
# Chosen for good contrast when alpha-blended over natural images.
_CLASS_COLORS = [
    (220, 100, 100),  # 1: Soft Red
    (100, 180, 100),  # 2: Muted Green
    (100, 140, 220),  # 3: Soft Blue
    (210, 200, 80),  # 4: Warm Yellow
    (200, 120, 180),  # 5: Lavender Pink
    (80, 190, 190),  # 6: Aqua
    (180, 100, 60),  # 7: Rust
    (100, 160, 80),  # 8: Leaf Green
    (140, 120, 200),  # 9: Soft Purple
    (170, 170, 70),  # 10: Mustard
    (200, 140, 100),  # 11: Peach
    (80, 150, 170),  # 12: Teal
    (230, 160, 80),  # 13: Goldenrod
    (210, 150, 180),  # 14: Rose
    (140, 110, 80),  # 15: Tan
    (120, 160, 200),  # 16: Sky Blue
    (200, 90, 120),  # 17: Berry
    (90, 170, 110),  # 18: Sage
    (220, 130, 60),  # 19: Amber
    (150, 120, 180),  # 20: Mauve
]


def _get_color_for_class(class_id: int) -> Tuple[int, int, int]:
    """Get the display color for a class ID.

    - class_id == 0: background, always black
    - class_id >= 1: cycles through the 20 _CLASS_COLORS via modulo
    """
    if class_id == 0:
        return (0, 0, 0)
    return _CLASS_COLORS[(class_id - 1) % len(_CLASS_COLORS)]


class Server:
    def __init__(self, config: dict):
        self.config = config
        self.dataset_dir = resolve_path(config.get("data_dir", "dataset"))
        self.image_dir = os.path.join(self.dataset_dir, "images")
        self.mask_dir = os.path.join(self.dataset_dir, "mapped_masks")

        self.dataset: Dataset = self.prepare_dataset()

    def prepare_dataset(self) -> Dataset:
        """Scan filenames only -- no file reading. Builds paired (image, mask) index."""
        # Build mask lookup: name_no_ext -> filename
        mask_lookup: Dict[str, str] = {}
        with os.scandir(self.mask_dir) as entries:
            for entry in entries:
                if entry.is_file():
                    mask_lookup[os.path.splitext(entry.name)[0]] = entry.name

        dataset = Dataset()
        with os.scandir(self.image_dir) as entries:
            for entry in entries:
                if not entry.is_file():
                    continue
                name_no_ext = os.path.splitext(entry.name)[0]
                if name_no_ext not in mask_lookup:
                    continue

                data = Data(
                    image_path=os.path.join(self.image_dir, entry.name),
                    mask_path=os.path.join(self.mask_dir, mask_lookup[name_no_ext]),
                    image_filename=entry.name,
                    mask_filename=mask_lookup[name_no_ext],
                    width=0,  # resolved on first request
                    height=0,
                    class_ids=[],  # resolved on first request
                )
                dataset.add_data(data)

        return dataset

    def get_data_by_id(self, data_id: int) -> Data:
        return self.dataset.get_data(data_id)

    def resolve_data_info(self, data: Data) -> dict:
        """Resolve width, height, and class_ids for a Data item (lazy, cached on the Data object)."""
        # Resolve image dimensions if not yet cached
        if data.width == 0 or data.height == 0:
            try:
                with Image.open(data.image_path) as img:
                    data.width, data.height = img.size
            except Exception:
                pass

        # Resolve class IDs from mask if not yet cached
        if not data.class_ids:
            try:
                with Image.open(data.mask_path) as mask:
                    mask_arr = np.array(mask)
                    data.class_ids = sorted(int(v) for v in np.unique(mask_arr))
            except Exception:
                pass

        # Always reserve ID 0 for background: ensure it is always present in class_ids
        # (even if the mask does not contain any background pixels).
        if 0 not in data.class_ids:
            data.class_ids = [0] + data.class_ids

        # Build per-image palette from class_ids (colors are deterministic by ID)
        class_palette = [{"id": 0, "name": "background", "color": [0, 0, 0]}]
        for cid in data.class_ids:
            if cid == 0:
                continue
            class_palette.append(
                {
                    "id": cid,
                    "name": f"class_{cid}",
                    "color": list(_get_color_for_class(cid)),
                }
            )

        return {
            "id": data.id,
            "image_filename": data.image_filename,
            "mask_filename": data.mask_filename,
            "image_url": f"/api/images/{data.id}",
            "mask_url": f"/api/masks/{data.id}",
            "width": data.width,
            "height": data.height,
            "class_ids": data.class_ids,
            "class_palette": class_palette,
        }

    def resolve_data_batch(
        self, data_list: List[Data], max_workers: int = 8
    ) -> List[dict]:
        """Resolve info for multiple Data items in parallel using a thread pool.

        PIL image decoding releases the GIL, so threading provides a real speedup
        for the I/O-bound task of opening image and mask files.
        """
        if not data_list:
            return []

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = list(executor.map(self.resolve_data_info, data_list))
        return results

    def make_palette_for_classes(self, class_ids: set) -> List[dict]:
        """Build palette entries for a given set of class IDs.

        Colors are deterministically assigned by class ID via _get_color_for_class,
        so no file scanning is needed.
        """
        palette = [{"id": 0, "name": "background", "color": [0, 0, 0]}]
        for cid in sorted(class_ids):
            if cid == 0:
                continue
            palette.append(
                {
                    "id": cid,
                    "name": f"class_{cid}",
                    "color": list(_get_color_for_class(cid)),
                }
            )
        return palette
