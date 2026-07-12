import os
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote

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
        self._palette_cache: Optional[List[dict]] = None

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

        return {
            "id": data.id,
            "image_filename": data.image_filename,
            "mask_filename": data.mask_filename,
            "image_url": f"/api/images/{quote(data.image_filename, safe='')}",
            "mask_url": f"/api/masks/{quote(data.mask_filename, safe='')}",
            "width": data.width,
            "height": data.height,
            "class_ids": data.class_ids,
        }

    def get_palette(self, sample_size: int = 2000) -> List[dict]:
        """Build a class palette by sampling masks. Results are cached after first call."""
        if self._palette_cache is not None:
            return self._palette_cache

        mask_names = sorted(os.listdir(self.mask_dir))
        step = max(1, len(mask_names) // sample_size)
        global_class_ids = set()

        for i in range(0, len(mask_names), step):
            mask_path = os.path.join(self.mask_dir, mask_names[i])
            try:
                with Image.open(mask_path) as mask:
                    mask_arr = np.array(mask)
                    global_class_ids.update(int(v) for v in np.unique(mask_arr))
            except Exception:
                pass

        palette = []
        # Always include background (id=0) as black
        palette.append(
            {
                "id": 0,
                "name": "background",
                "color": [0, 0, 0],
            }
        )
        for cid in sorted(global_class_ids):
            if cid == 0:
                continue  # already added above
            palette.append(
                {
                    "id": cid,
                    "name": f"class_{cid}",
                    "color": list(_get_color_for_class(cid)),
                }
            )

        self._palette_cache = palette
        return palette
