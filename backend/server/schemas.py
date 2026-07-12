from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ClassInfo(BaseModel):
    """Information about a single semantic class."""

    id: int
    name: str
    color: List[int]  # [R, G, B]


class DataItemResponse(BaseModel):
    """Response model for a single dataset item (image + mask pair)."""

    id: int
    image_filename: str
    mask_filename: str
    image_url: str
    mask_url: str
    width: int
    height: int
    class_ids: List[int]


class DatasetListResponse(BaseModel):
    """Response model for listing all dataset items."""

    total: int
    data: List[DataItemResponse]
    class_palette: List[ClassInfo]
