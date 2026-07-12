from typing import List, Optional, Tuple


class Data:
    """Represents a single data point: an image and its corresponding semantic mask."""

    def __init__(
        self,
        image_path: str = "",
        mask_path: str = "",
        image_filename: str = "",
        mask_filename: str = "",
        width: int = 0,
        height: int = 0,
        class_ids: Optional[List[int]] = None,
    ):
        self.id: Optional[int] = None
        self.image_path = image_path
        self.mask_path = mask_path
        self.image_filename = image_filename
        self.mask_filename = mask_filename
        self.width = width
        self.height = height
        self.class_ids = class_ids or []

    def set_id(self, id: int):
        self.id = id

    def get_id(self) -> int:
        return self.id
