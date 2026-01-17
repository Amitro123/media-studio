"""
🎬 Media Studio API Routes
POST /api/generate - Generate social media assets
"""

import os
import io
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Import services (will be created next)
from services.image_processor import ImageProcessor


router = APIRouter()

# Output directory for generated assets
OUTPUT_DIR = Path(__file__).parent.parent.parent / "static" / "generated"

# Social media format specifications
FORMATS = [
    {
        "name": "Facebook Feed",
        "format": "16:9",
        "width": 1200,
        "height": 675,
    },
    {
        "name": "Instagram Square",
        "format": "1:1",
        "width": 1080,
        "height": 1080,
    },
    {
        "name": "Instagram Story",
        "format": "9:16",
        "width": 1080,
        "height": 1920,
    },
    {
        "name": "Facebook/Instagram Portrait",
        "format": "4:5",
        "width": 1080,
        "height": 1350,
    },
]


class AssetResponse(BaseModel):
    """Single generated asset response."""
    platform: str
    format: str
    width: int
    height: int
    url: str


class GenerateResponse(BaseModel):
    """Response model for /api/generate endpoint."""
    status: str
    assets: list[AssetResponse]
    metadata: dict


@router.post("/generate")
async def generate_assets(
    mode: str = Form("from-image"),
    image: Optional[UploadFile] = File(None),
    title: str = Form(""),
    cta: str = Form(""),
    title_font_size: int = Form(68),
    cta_font_size: int = Form(50),
    text_position: str = Form("center"),
    text_opacity: float = Form(0.6),
    logo_enabled: bool = Form(True),
    logo_file: Optional[UploadFile] = File(None),
    logo_position: str = Form("top-right"),
    logo_size: int = Form(90),
    formats: str = Form("16:9,1:1,9:16,4:5")
):
    """
    Generate social media assets with overlays.
    Returns base64 encoded images directly.
    """
    try:
        # Parse formats
        format_list = [f.strip() for f in formats.split(",")]
        
        # Save uploaded image temporarily
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        input_path = f"/tmp/input_{timestamp}.jpg"
        
        # Determine base image
        if image:
            content = await image.read()
            with open(input_path, "wb") as f:
                f.write(content)
        else:
            # Create placeholder if no image (e.g. text-to-creative flow mock)
            from PIL import Image
            img = Image.new('RGB', (1200, 1200), color=(40, 40, 60))
            # Basic gradient
            for y in range(1200):
                r = int(40 + (y/1200)*60)
                for x in range(1200):
                     img.putpixel((x,y), (r, 40, 80))
            img.save(input_path)
        
        # Save logo if provided
        logo_path = None
        if logo_enabled and logo_file:
            logo_path = f"/tmp/logo_{timestamp}.png"
            with open(logo_path, "wb") as f:
                f.write(await logo_file.read())
        
        # Initialize processor
        processor = ImageProcessor()
        
        # Generate assets for each format
        results = []
        import base64
        
        for format_key in format_list:
            if format_key not in ["16:9", "1:1", "9:16", "4:5"]:
                continue
            
            # Map format to dimensions
            dimensions = {
                "16:9": (1200, 675),
                "1:1": (1080, 1080),
                "9:16": (1080, 1920),
                "4:5": (1080, 1350)
            }
            
            platform_names = {
                "16:9": "Facebook Feed",
                "1:1": "Instagram Square",
                "9:16": "Instagram Story",
                "4:5": "Facebook/Instagram Portrait"
            }
            
            width, height = dimensions.get(format_key, (1080, 1080))
            
            # Generate image
            output_path = f"/tmp/output_{format_key.replace(':','x')}_{timestamp}.jpg"
            
            processor.generate_asset(
                input_image_path=input_path,
                output_path=output_path,
                width=width,
                height=height,
                title=title,
                cta=cta,
                font_size=title_font_size, # Use title font size
                text_position=text_position,
                logo_path=logo_path if logo_enabled else None,
                logo_position=logo_position,
                logo_size=logo_size
            )
            
            # Read generated file and encode to base64
            with open(output_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode()
            
            results.append({
                "format": format_key,
                "platform": platform_names.get(format_key, "Social Media"),
                "width": width,
                "height": height,
                "url": f"data:image/jpeg;base64,{image_data}",
                "filename": f"media_studio_{format_key.replace(':','x')}_{timestamp}.jpg"
            })
            
            # Cleanup output
            if os.path.exists(output_path):
                os.remove(output_path)
        
        # Cleanup input files
        if os.path.exists(input_path):
            os.remove(input_path)
        if logo_path and os.path.exists(logo_path):
            os.remove(logo_path)
        
        return JSONResponse(content={
            "success": True,
            "assets": results,
            "count": len(results),
            "metadata": {"mode": mode}
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )
        
        assets = []
        
        for fmt in selected_formats:
            # Generate asset for this format with designer options
            output_image = processor.create_asset(
                base_image=base_image,
                width=fmt["width"],
                height=fmt["height"],
                prompt_data=prompt_data,
            )
            
            # Save to file
            format_slug = fmt["format"].replace(":", "x")
            filename = f"asset_{format_slug}_{timestamp}_{unique_id}.jpg"
            output_path = OUTPUT_DIR / filename
            
            # Ensure output directory exists
            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            
            # Save image
            output_image.save(str(output_path), "JPEG", quality=90)
            
            # Build asset response
            assets.append(AssetResponse(
                platform=fmt["name"],
                format=fmt["format"],
                width=fmt["width"],
                height=fmt["height"],
                url=f"/static/generated/{filename}",
            ))
        
        # ============================================
        # 8. BUILD RESPONSE
        # ============================================
        return GenerateResponse(
            status="success",
            assets=assets,
            metadata={
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "mode": mode,
                "prompt": prompt or f"title: {title or ''}, cta: {cta or ''}",
                "parsed_prompt": prompt_data,
                "total_assets": len(assets),
                "formats_requested": requested_formats,
            }
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    
    except Exception as e:
        # Catch-all for unexpected errors
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Generation failed",
                "message": str(e),
                "type": type(e).__name__,
            }
        )


@router.get("/formats")
async def list_formats():
    """
    List all available output formats.
    """
    return {
        "formats": FORMATS,
        "total": len(FORMATS),
    }


@router.delete("/generated/{filename}")
async def delete_asset(filename: str):
    """
    Delete a generated asset file.
    """
    file_path = OUTPUT_DIR / filename
    
    # Security: Prevent path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename"
        )
    
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )
    
    try:
        file_path.unlink()
        return {"status": "deleted", "filename": filename}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete: {str(e)}"
        )


# ============================================
# CHAT COMMAND PARSER
# ============================================

class CommandRequest(BaseModel):
    """Request model for parse-command endpoint."""
    command: str
    current_options: Optional[dict] = None


class CommandResponse(BaseModel):
    """Response model for parse-command endpoint."""
    action: str
    params: dict


@router.post("/parse-command", response_model=CommandResponse)
async def parse_command(request: CommandRequest):
    """
    Parse natural language commands into design parameters.
    
    Supports Hebrew and English commands for:
    - Logo size: "הגדל לוגו", "enlarge logo", "bigger logo"
    - Logo position: "לוגו שמאל למעלה", "logo top-left"
    - Logo toggle: "בלי לוגו", "הסר לוגו", "no logo"
    - Text position: "טקסט למעלה", "text to top"
    - Font size: "הגדל פונט", "bigger text"
    - Opacity: "שקוף יותר", "more transparent"
    - Formats: "רק 16:9", "only square"
    
    Returns action description and parameter changes.
    """
    command = request.command.lower().strip()
    current = request.current_options or {}
    
    # Get current values with defaults
    current_logo_size = current.get("logoSize", 150)
    current_font_size = current.get("titleFontSize", 90)
    current_opacity = current.get("textOpacity", 0.6)
    
    # ============================================
    # LOGO SIZE COMMANDS
    # ============================================
    if any(word in command for word in ["הגדל", "גדול", "enlarge", "bigger", "larger"]):
        if any(word in command for word in ["לוגו", "logo"]):
            new_size = min(current_logo_size + 50, 300)
            return CommandResponse(
                action=f"Logo size increased: {current_logo_size}px → {new_size}px",
                params={"logo_size": new_size}
            )
        if any(word in command for word in ["פונט", "טקסט", "font", "text"]):
            new_size = min(current_font_size + 10, 120)
            return CommandResponse(
                action=f"Font size increased: {current_font_size}px → {new_size}px",
                params={"title_font_size": new_size}
            )
    
    if any(word in command for word in ["הקטן", "קטן", "smaller", "reduce"]):
        if any(word in command for word in ["לוגו", "logo"]):
            new_size = max(current_logo_size - 50, 80)
            return CommandResponse(
                action=f"Logo size decreased: {current_logo_size}px → {new_size}px",
                params={"logo_size": new_size}
            )
        if any(word in command for word in ["פונט", "טקסט", "font", "text"]):
            new_size = max(current_font_size - 10, 60)
            return CommandResponse(
                action=f"Font size decreased: {current_font_size}px → {new_size}px",
                params={"title_font_size": new_size}
            )
    
    # ============================================
    # LOGO POSITION COMMANDS
    # ============================================
    if any(word in command for word in ["לוגו", "logo"]):
        if any(word in command for word in ["שמאל", "left"]) and any(word in command for word in ["למעלה", "top", "עליון"]):
            return CommandResponse(
                action="Logo moved to top-left",
                params={"logo_position": "top-left"}
            )
        if any(word in command for word in ["ימין", "right"]) and any(word in command for word in ["למעלה", "top", "עליון"]):
            return CommandResponse(
                action="Logo moved to top-right",
                params={"logo_position": "top-right"}
            )
        if any(word in command for word in ["שמאל", "left"]) and any(word in command for word in ["למטה", "bottom", "תחתון"]):
            return CommandResponse(
                action="Logo moved to bottom-left",
                params={"logo_position": "bottom-left"}
            )
        if any(word in command for word in ["ימין", "right"]) and any(word in command for word in ["למטה", "bottom", "תחתון"]):
            return CommandResponse(
                action="Logo moved to bottom-right",
                params={"logo_position": "bottom-right"}
            )
    
    # ============================================
    # LOGO TOGGLE COMMANDS
    # ============================================
    if any(word in command for word in ["בלי לוגו", "הסר לוגו", "ללא לוגו", "no logo", "remove logo", "hide logo"]):
        return CommandResponse(
            action="Logo hidden",
            params={"logo_enabled": False}
        )
    
    if any(word in command for word in ["הוסף לוגו", "הצג לוגו", "show logo", "add logo"]):
        return CommandResponse(
            action="Logo shown",
            params={"logo_enabled": True}
        )
    
    # ============================================
    # TEXT POSITION COMMANDS
    # ============================================
    if any(word in command for word in ["טקסט", "text", "כותרת", "title"]):
        if any(word in command for word in ["למעלה", "top", "עליון", "מעל"]):
            return CommandResponse(
                action="Text moved to top",
                params={"title_position": "top"}
            )
        if any(word in command for word in ["למטה", "bottom", "תחתון", "מתחת"]):
            return CommandResponse(
                action="Text moved to bottom",
                params={"title_position": "bottom"}
            )
        if any(word in command for word in ["מרכז", "center", "באמצע"]):
            return CommandResponse(
                action="Text centered",
                params={"title_position": "center"}
            )
    
    # ============================================
    # OPACITY COMMANDS
    # ============================================
    if any(word in command for word in ["שקוף", "transparent", "opacity"]):
        if any(word in command for word in ["יותר", "more", "פחות"]):
            new_opacity = max(current_opacity - 0.2, 0.1)
            return CommandResponse(
                action=f"Background opacity reduced: {int(current_opacity*100)}% → {int(new_opacity*100)}%",
                params={"title_opacity": new_opacity}
            )
    
    if any(word in command for word in ["אטום", "solid", "כהה", "dark"]):
        new_opacity = min(current_opacity + 0.2, 0.9)
        return CommandResponse(
            action=f"Background opacity increased: {int(current_opacity*100)}% → {int(new_opacity*100)}%",
            params={"title_opacity": new_opacity}
        )
    
    # ============================================
    # FORMAT SELECTION COMMANDS
    # ============================================
    if "רק" in command or "only" in command:
        selected_formats = []
        
        if "16:9" in command or "facebook" in command or "פייסבוק" in command:
            selected_formats.append("16:9")
        if "1:1" in command or "square" in command or "ריבוע" in command or "אינסטגרם" in command:
            selected_formats.append("1:1")
        if "9:16" in command or "story" in command or "סטורי" in command:
            selected_formats.append("9:16")
        if "4:5" in command or "portrait" in command or "פורטרט" in command:
            selected_formats.append("4:5")
        
        if selected_formats:
            return CommandResponse(
                action=f"Formats set to: {', '.join(selected_formats)}",
                params={"formats": selected_formats}
            )
    
    if "כל הפורמטים" in command or "all formats" in command:
        return CommandResponse(
            action="All formats selected",
            params={"formats": ["16:9", "1:1", "9:16", "4:5"]}
        )
    
    # ============================================
    # PRESET COMMANDS
    # ============================================
    if any(word in command for word in ["אינסטגרם", "instagram"]):
        return CommandResponse(
            action="Instagram format preset applied",
            params={"formats": ["1:1", "9:16", "4:5"]}
        )
    
    if any(word in command for word in ["פייסבוק", "facebook"]):
        return CommandResponse(
            action="Facebook format preset applied",
            params={"formats": ["16:9", "1:1", "4:5"]}
        )
    
    # ============================================
    # FALLBACK: Unknown command
    # ============================================
    return CommandResponse(
        action="Could not understand command. Try: 'bigger logo', 'text to top', 'only 16:9'",
        params={}
    )

