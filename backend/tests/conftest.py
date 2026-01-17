"""Shared test fixtures and configuration."""
import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import tempfile
import shutil
from PIL import Image
import sys
import os

# Add backend to path so we can import main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)

@pytest.fixture
def test_image_path():
    """Create a test image."""
    temp_dir = tempfile.mkdtemp()
    image_path = Path(temp_dir) / "test_image.jpg"
    
    # Create a simple test image
    img = Image.new('RGB', (1200, 800), color=(73, 109, 137))
    img.save(image_path)
    
    yield str(image_path)
    
    # Cleanup
    shutil.rmtree(temp_dir)

@pytest.fixture
def test_logo_path():
    """Create a test logo."""
    temp_dir = tempfile.mkdtemp()
    logo_path = Path(temp_dir) / "test_logo.png"
    
    # Create a simple test logo with transparency
    img = Image.new('RGBA', (200, 200), color=(255, 0, 0, 255))
    img.save(logo_path)
    
    yield str(logo_path)
    
    # Cleanup
    shutil.rmtree(temp_dir)
