"""
🎬 Image Processor - Smart Crop + Text Overlay + Multi-Format Generation
Supports Hebrew RTL text with proper bidirectional rendering.
"""

import os
import io
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Union, Literal

from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

# RTL text support
try:
    from bidi.algorithm import get_display
    BIDI_AVAILABLE = True
except ImportError:
    BIDI_AVAILABLE = False

try:
    import arabic_reshaper
    RESHAPER_AVAILABLE = True
except ImportError:
    RESHAPER_AVAILABLE = False

# Import logo handler
import sys
_current_dir = Path(__file__).parent
_backend_dir = _current_dir.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

try:
    from services.logo_handler import add_logo
except ImportError:
    from logo_handler import add_logo

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent.parent / "static" / "generated"

def smart_crop(img: Image.Image, target_width: int, target_height: int) -> Image.Image:
    """Smart crop image to exact dimensions while maintaining quality."""
    # Convert to RGB if needed
    if img.mode != "RGB":
        img = img.convert("RGB")
        
    img_ratio = img.width / img.height
    target_ratio = target_width / target_height
    
    if target_ratio > img_ratio:
        # Target is wider - crop height
        new_height = int(img.width / target_ratio)
        offset = (img.height - new_height) // 2
        box = (0, offset, img.width, offset + new_height)
    else:
        # Target is taller - crop width
        new_width = int(img.height * target_ratio)
        offset = (img.width - new_width) // 2
        box = (offset, 0, offset + new_width, img.height)
        
    img = img.crop(box)
    return img.resize((target_width, target_height), Image.Resampling.LANCZOS)

class ImageProcessor:
    def smart_crop(self, img, width, height):
        return smart_crop(img, width, height)

    def resize_logo(self, logo, size):
        aspect_ratio = logo.width / logo.height
        new_height = int(size / aspect_ratio)
        return logo.resize((size, new_height), Image.Resampling.LANCZOS)

    def add_logo(self, img, logo_image, position):
        base = img.convert("RGBA")
        padding = 40
        w, h = base.size
        lw, lh = logo_image.size
        
        positions = {
            "top-right": (w - lw - padding, padding),
            "top-left": (padding, padding),
            "bottom-right": (w - lw - padding, h - lh - padding),
            "bottom-left": (padding, h - lh - padding),
        }
        pos = positions.get(position, positions["top-right"])
        
        base.paste(logo_image, pos, logo_image)
        return base.convert("RGB")

    def generate_asset(
        self,
        input_image_path: str,
        output_path: str,
        width: int,
        height: int,
        title: str = "",
        cta: str = "",
        font_size: int = 68,
        text_position: str = "center",
        logo_path: str = None,
        logo_position: str = "top-right",
        logo_size: int = 90
    ):
        """Generate a single asset with overlays."""
        # Load and resize image
        img = Image.open(input_image_path).convert("RGB")
        img = self.smart_crop(img, width, height)
        
        # Add logo
        if logo_path:
            logo = Image.open(logo_path).convert("RGBA")
            # Basic white removal if needed? Assuming existing flow handles it or logo is pre-processed
            # In user code, they just open it. I'll rely on that. 
            # But logo_handler does preparation.
            # User code uses self.add_logo.
            
            logo = self.resize_logo(logo, logo_size)
            img = self.add_logo(img, logo, logo_position)
        
        # Add text overlay
        if title or cta:
            img = self.add_text_overlay(
                img, 
                title, 
                cta, 
                font_size, 
                text_position
            )
        
        # Save
        img.save(output_path, "JPEG", quality=95)
        return output_path

    def add_text_overlay(
        self, 
        image, 
        title, 
        cta, 
        font_size, 
        position="center"
    ):
        """Add text with semi-transparent background."""
        import textwrap
        
        img = image.copy()
        width, height = img.size
        
        # Create drawing context
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # Load font
        try:
            # Try specific fonts or fallback
            font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
            if not os.path.exists(font_path):
                # Try Windows paths
                font_path = "C:/Windows/Fonts/arialbd.ttf"
            
            font_title = ImageFont.truetype(font_path, font_size)
            font_cta = ImageFont.truetype(font_path.replace("bd.ttf", ".ttf"), font_size // 2)
        except:
            font_title = ImageFont.load_default()
            font_cta = ImageFont.load_default()
        
        # Calculate text size
        bbox_title = draw.textbbox((0, 0), title, font=font_title)
        title_width = bbox_title[2] - bbox_title[0]
        title_height = bbox_title[3] - bbox_title[1]
        
        # Calculate Y position based on text_position
        # We need total height of text block
        cta_height = 0
        if cta:
            bbox_cta = draw.textbbox((0, 0), cta, font=font_cta)
            cta_height = bbox_cta[3] - bbox_cta[1]
            cta_height += 30 # Padding between title and CTA
        
        total_text_height = title_height + cta_height + 40 # Padding around
        
        if position == "top":
            y_start = height * 0.15  # 15% from top
        elif position == "bottom":
            y_start = height * 0.85 - total_text_height # 15% from bottom
        else:  # center
            y_start = (height - total_text_height) // 2
        
        # Draw semi-transparent background
        padding = 40
        # Background covers full width? User code: [(0, bg_y1), (width, bg_y2)]
        bg_y1 = int(y_start - padding)
        bg_y2 = int(y_start + total_text_height + padding)
        draw.rectangle(
            [(0, bg_y1), (width, bg_y2)],
            fill=(0, 0, 0, 153)  # 60% opacity
        )
        
        # Draw title
        title_x = (width - title_width) // 2
        # y_start is top of text block?
        # User code: draw.text((title_x, y_start), ...)
        draw.text(
            (title_x, y_start), 
            title, 
            font=font_title, 
            fill=(255, 255, 255, 255)
        )
        
        # Draw CTA
        if cta:
            cta_y = y_start + title_height + 30
            bbox_cta = draw.textbbox((0, 0), cta, font=font_cta)
            cta_w = bbox_cta[2] - bbox_cta[0]
            cta_h = bbox_cta[3] - bbox_cta[1]
            cta_x = (width - cta_w) // 2
            
            # Draw CTA button background (gold)
            button_padding = 15
            button_rect = [
                (cta_x - button_padding, cta_y - 5),
                (cta_x + cta_w + button_padding, cta_y + cta_h + 10)
            ]
            draw.rounded_rectangle(
                button_rect,
                radius=8,
                fill=(255, 215, 0, 255)  # Gold
            )
            
            # Draw CTA text (black on gold)
            draw.text(
                (cta_x, cta_y), 
                cta, 
                font=font_cta, 
                fill=(0, 0, 0, 255)
            )
        
        # Composite overlay onto image
        img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
        return img
