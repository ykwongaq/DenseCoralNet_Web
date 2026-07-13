import asyncio
import json
import os
import threading
from typing import Annotated, Any, List, Optional

import numpy as np
from fastapi import (
    BackgroundTasks,
    FastAPI,
    File,
    Form,
    HTTPException,
    Query,
    Response,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from PIL import Image
from server import server
from server.utils.logger import get_logger, setup_logging

# Get the directory where this script is located
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(_SCRIPT_DIR, "config.json")

with open(config_path, "r") as f:
    config = json.load(f)

# Set up logging
log_dir = config.get("log_dir", "logs")
setup_logging(log_dir)
_logger = get_logger(__name__)

_logger.info("Loaded config from %s", config_path)

_server = server.Server(config)
app = FastAPI(title="DenseCoralNet API")

# CORS must be added first (outermost middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev
        "http://localhost:3000",  # Alt dev port
        "https://dense-coralnet.hkustvgd.com",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------


@app.get("/api/dataset")
async def list_dataset(
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=10000, description="Max items to return"),
):
    """List dataset items with pagination.

    Returns a JSON object with:
      - total: total number of items in the dataset
      - data: list of DataItemResponse (paginated), each including a per-image class_palette
    """
    all_data = _server.dataset.get_all_data()
    total = len(all_data)
    page = all_data[offset : offset + limit]

    data_items = _server.resolve_data_batch(page)

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "data": data_items,
    }


@app.get("/api/dataset/{data_id}")
async def get_dataset_item(data_id: int):
    """Get a single dataset item by its ID."""
    data = _server.dataset.get_data(data_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Data item {data_id} not found")

    return _server.resolve_data_info(data)


@app.get("/api/images/{data_id}")
async def serve_image(data_id: int):
    """Serve an image file from the dataset by data ID."""
    data = _server.dataset.get_data(data_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Data item {data_id} not found")

    return FileResponse(data.image_path, media_type="image/jpeg")


@app.get("/api/masks/{data_id}")
async def serve_mask(data_id: int):
    """Serve a mask PNG file from the dataset by data ID."""
    data = _server.dataset.get_data(data_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Data item {data_id} not found")

    return FileResponse(data.mask_path, media_type="image/png")


@app.get("/api/palette")
async def get_palette():
    """Return the class color palette derived from all resolved data items.

    This endpoint is kept for backward compatibility; the frontend now
    uses per-image palettes from /api/dataset responses.
    """
    all_class_ids = _server.dataset.get_all_class_ids()
    return {
        "class_palette": _server.make_palette_for_classes(all_class_ids),
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "dataset_size": len(_server.dataset),
    }
