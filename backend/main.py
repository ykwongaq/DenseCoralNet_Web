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
app = FastAPI(title="CoralSCOP-LAT API")

# CORS must be added first (outermost middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
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
    """List dataset items with pagination and class palette.

    Returns a JSON object with:
      - total: total number of items in the dataset
      - data: list of DataItemResponse (paginated)
      - class_palette: list of ClassInfo with id, name, color
    """
    all_data = _server.dataset.get_all_data()
    total = len(all_data)
    page = all_data[offset : offset + limit]

    data_items = [_server.resolve_data_info(d) for d in page]

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "data": data_items,
        "class_palette": _server.get_palette(),
    }


@app.get("/api/dataset/{data_id}")
async def get_dataset_item(data_id: int):
    """Get a single dataset item by its ID."""
    data = _server.dataset.get_data(data_id)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Data item {data_id} not found")

    return _server.resolve_data_info(data)


@app.get("/api/images/{filename}")
async def serve_image(filename: str):
    """Serve an image file from the dataset."""
    file_path = os.path.join(_server.image_dir, filename)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail=f"Image '{filename}' not found")

    return FileResponse(file_path, media_type="image/jpeg")


@app.get("/api/masks/{filename}")
async def serve_mask(filename: str):
    """Serve a mask PNG file from the dataset."""
    file_path = os.path.join(_server.mask_dir, filename)

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail=f"Mask '{filename}' not found")

    return FileResponse(file_path, media_type="image/png")


@app.get("/api/palette")
async def get_palette():
    """Return the class color palette (cached after first call)."""
    return {
        "class_palette": _server.get_palette(),
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "dataset_size": len(_server.dataset),
    }
