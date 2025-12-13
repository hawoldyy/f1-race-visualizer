from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

app = FastAPI(
    title="F1 Race Visualizer API",
    description="Local-only API for fetching and visualizing Formula 1 race data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

@app.get("/data/{filename}")
async def get_csv_file(filename: str):
    file_path = f"data/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@app.get("/")
def read_root() -> Dict[str, str]:
    return {"message": "F1 Race Visualizer Backend (Local Mode) is running!", "status": "healthy"}


