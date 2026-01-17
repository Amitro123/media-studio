"""
🎨 Logo Handler - Transparent Watermark
CRITICAL: Must use alpha compositing to avoid solid white box!
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
from typing import Literal, Optional, Union
import numpy as np

Position = Literal["top-right", "top-left", "bottom-right", "bottom-left"]


def remove_white_background(
    image: Image.Image,
    threshold: int = 240,
    feather: int = 2,
) -> Image.Image:
    """
    Remove white/near-white background from an image, making it transparent.
    
    Args:
        image: PIL Image (will be converted to RGBA)
        threshold: Pixels with R, G, B all above this are considered "white" (0-255)
        feather: Edge feathering in pixels for smoother edges
    
    Returns:
        RGBA image with white background removed
    """
    # Convert to RGBA
    if image.mode != "RGBA":
        image = image.convert("RGBA")
    
    # Get image data as numpy array for faster processing
    data = np.array(image)
    
    # Extract RGBA channels
    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    
    # Find white pixels (where R, G, B are all above threshold)
    white_mask = (r > threshold) & (g > threshold) & (b > threshold)
    
    # Make white pixels transparent
    data[:, :, 3] = np.where(white_mask, 0, a)
    
    # Create new image from modified data
    result = Image.fromarray(data, mode="RGBA")
    
    # Optional: Apply slight blur to edges for smoother transition
    if feather > 0:
        # Extract alpha channel, blur it slightly, and reapply
        alpha = result.split()[3]
        alpha = alpha.filter(ImageFilter.GaussianBlur(radius=feather))
        result.putalpha(alpha)
    
    return result


def prepare_logo(
    logo_path: Union[str, Path],
    remove_background: bool = True,
    threshold: int = 240,
) -> Image.Image:
    """
    Load and prepare a logo image, optionally removing white background.
    
    Args:
        logo_path: Path to logo file
        remove_background: If True, removes white background
        threshold: White detection threshold (240 works for most logos)
    
    Returns:
        RGBA image ready for compositing
    """
    logo = Image.open(logo_path)
    
    if logo.mode != "RGBA":
        logo = logo.convert("RGBA")
    
    if remove_background:
        logo = remove_white_background(logo, threshold)
    
    return logo


def add_transparent_logo(
    image: Image.Image,
    text: str = "KESHET",
    position: Position = "top-right",
    opacity: float = 0.35,
    font_size: int = 70,
    color: tuple = (255, 255, 255),  # White
) -> Image.Image:
    """
    Add semi-transparent text watermark to image.
    
    Args:
        image: PIL Image object
        text: Watermark text
        position: Corner position
        opacity: 0.0-1.0 (0.35 = 35%)
        font_size: Text size in pixels
        color: RGB color tuple
    
    Returns:
        Image with transparent watermark
    """
    # Step 1: Create transparent overlay (RGBA)
    overlay = Image.new("RGBA", image.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Step 2: Load font (fallback to default if Arial missing)
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except IOError:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except IOError:
            try:
                # Windows fallback
                font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
            except IOError:
                font = ImageFont.load_default()
    
    # Step 3: Calculate text dimensions
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Step 4: Calculate position based on corner
    padding = 40
    positions = {
        "top-right": (image.width - text_width - padding, padding),
        "top-left": (padding, padding),
        "bottom-right": (image.width - text_width - padding, image.height - text_height - padding),
        "bottom-left": (padding, image.height - text_height - padding),
    }
    
    pos = positions.get(position, positions["top-right"])
    
    # Step 5: Draw text with opacity (CRITICAL PART!)
    alpha_value = int(255 * opacity)  # 0.35 → 89 out of 255
    text_color_with_alpha = (*color, alpha_value)  # (255, 255, 255, 89)
    
    draw.text(pos, text, fill=text_color_with_alpha, font=font)
    
    # Step 6: Composite overlay onto image (THIS PREVENTS WHITE BOX!)
    if image.mode != "RGBA":
        image = image.convert("RGBA")
    
    result = Image.alpha_composite(image, overlay)
    
    # Step 7: Convert back to RGB for JPEG compatibility
    return result.convert("RGB")


def add_image_logo(
    image: Image.Image,
    logo_path: Union[str, Path],
    position: Position = "top-right",
    logo_width: int = 150,
    opacity: float = 0.85,
    remove_background: bool = True,
) -> Image.Image:
    """
    Add semi-transparent image logo to image.
    
    Automatically removes white background from logos for seamless blending.
    
    Args:
        image: PIL Image object (base image)
        logo_path: Path to logo file (PNG recommended)
        position: Corner position
        logo_width: Target width in pixels (height calculated to maintain aspect ratio)
        opacity: 0.0-1.0 (0.85 = 85% - more visible for logos)
        remove_background: If True, removes white background from logo
    
    Returns:
        Image with transparent logo overlay
    """
    # Step 1: Load logo and remove white background
    logo = prepare_logo(logo_path, remove_background=remove_background)
    
    # Step 2: Resize logo maintaining aspect ratio (based on width)
    original_width, original_height = logo.size
    aspect_ratio = original_height / original_width
    new_height = int(logo_width * aspect_ratio)
    logo = logo.resize((logo_width, new_height), Image.Resampling.LANCZOS)
    
    # Step 3: Apply opacity to logo
    # Get alpha channel and multiply by opacity
    r, g, b, a = logo.split()
    a = a.point(lambda x: int(x * opacity))
    logo = Image.merge("RGBA", (r, g, b, a))
    
    # Step 4: Calculate position
    padding = 40
    logo_w, logo_h = logo.size
    
    positions = {
        "top-right": (image.width - logo_w - padding, padding),
        "top-left": (padding, padding),
        "bottom-right": (image.width - logo_w - padding, image.height - logo_h - padding),
        "bottom-left": (padding, image.height - logo_h - padding),
    }
    
    pos = positions.get(position, positions["top-right"])
    
    # Step 5: Create transparent overlay and paste logo
    if image.mode != "RGBA":
        image = image.convert("RGBA")
    
    # Create a copy to avoid modifying original
    result = image.copy()
    
    # Paste logo with alpha mask (uses alpha_composite internally)
    result.paste(logo, pos, logo)
    
    # Step 6: Convert back to RGB for JPEG compatibility
    return result.convert("RGB")


def add_logo_to_image(
    image_path: str,
    output_path: str,
    logo_text: str = "KESHET",
    position: Position = "top-right",
    opacity: float = 0.35,
) -> str:
    """
    Convenience function: Load image → Add logo → Save.
    
    Returns:
        Path to saved image
    """
    img = Image.open(image_path)
    img_with_logo = add_transparent_logo(img, logo_text, position, opacity)
    img_with_logo.save(output_path, quality=95)
    return output_path


def add_logo(
    image: Image.Image,
    position: Position = "top-right",
    logo_path: Optional[Union[str, Path]] = None,
    logo_width: int = 150,
    opacity: float = 0.85,
) -> Image.Image:
    """
    Add logo to image - tries image logo first, falls back to text.
    
    Looks for logo at: static/logo/mako_logo.png by default.
    If logo image exists: uses add_image_logo() with 85% opacity.
    If not exists: falls back to "KESHET" text watermark at 35% opacity.
    
    Args:
        image: Base PIL Image
        position: Corner position ("top-right", "top-left", etc.)
        logo_path: Custom path to logo image (optional)
        logo_width: Width in pixels for logo (default 150px)
        opacity: 0.0-1.0 for logo image (default 0.85 = 85%)
    
    Returns:
        Image with logo/watermark
    """
    # Default logo path: static/logo/mako_logo.png
    if logo_path is None:
        logo_path = Path(__file__).parent.parent.parent / "static" / "logo" / "mako_logo.png"

    # Check if input is a file-like object (e.g. BytesIO) or a path
    is_path_like = isinstance(logo_path, (str, Path))
    
    if not is_path_like:
        # Assume it's a file-like object (BytesIO)
        # Directly use add_image_logo which calls Image.open()
        return add_image_logo(image, logo_path, position, logo_width, opacity)

    # It is a path
    path_obj = Path(logo_path)
    
    # Try image logo first
    if path_obj.exists():
        return add_image_logo(image, str(path_obj), position, logo_width, opacity)
    else:
        # Fallback to text watermark (35% opacity for text)
        return add_transparent_logo(image, "KESHET", position, opacity=0.35)


# ============================================
# TESTING FUNCTION
# ============================================
def test_logo_handler():
    """
    Quick test to verify logo handler works correctly.
    Run: python logo_handler.py
    
    Generates two test images:
    1. test_logo_mako.jpg - With Mako image logo (if exists)
    2. test_logo_text.jpg - With KESHET text watermark
    """
    output_dir = Path(__file__).parent.parent.parent / "static" / "generated"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create test image (gradient to test transparency)
    test_img = Image.new("RGB", (800, 600))
    
    # Create gradient
    for x in range(800):
        for y in range(600):
            r = int((x / 800) * 255)
            g = int((y / 600) * 255)
            b = 128
            test_img.putpixel((x, y), (r, g, b))
    
    # ============================================
    # TEST 1: Universal add_logo() function
    # ============================================
    # This will use mako_logo.png if it exists, otherwise falls back to text
    result1 = add_logo(test_img.copy(), position="top-right")
    output1 = output_dir / "test_logo_mako.jpg"
    result1.save(str(output1), quality=95)
    
    logo_path = Path(__file__).parent.parent.parent / "static" / "logo" / "mako_logo.png"
    if logo_path.exists():
        print(f"✅ Test 1: Mako logo saved to: {output1}")
        print(f"   Logo file: {logo_path}")
        print(f"   Opacity: 85% | Width: 150px")
    else:
        print(f"⚠️  Test 1: Text fallback saved to: {output1}")
        print(f"   Logo not found at: {logo_path}")
    
    # ============================================
    # TEST 2: Text watermark (explicit)
    # ============================================
    result2 = add_transparent_logo(
        test_img.copy(),
        text="KESHET",
        position="top-right",
        opacity=0.35,
    )
    output2 = output_dir / "test_logo_text.jpg"
    result2.save(str(output2), quality=95)
    print(f"✅ Test 2: Text watermark saved to: {output2}")
    print(f"   Text: KESHET | Opacity: 35%")
    
    print("\n🔍 Verify both images:")
    print("   - Logo should be transparent (no solid white box)")
    print("   - Text should blend with gradient background")
    
    return result1, result2


if __name__ == "__main__":
    test_logo_handler()
