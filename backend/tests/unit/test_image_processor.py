"""Unit tests for image processor."""
import pytest
from PIL import Image
from services.image_processor import ImageProcessor
import os

class TestImageProcessor:
    """Test ImageProcessor class."""
    
    def setup_method(self):
        """Setup for each test."""
        self.processor = ImageProcessor()
    
    def test_smart_crop_maintains_aspect_ratio(self, test_image_path):
        """Test that smart_crop produces correct dimensions."""
        img = Image.open(test_image_path)
        
        # Test 16:9 crop
        cropped = self.processor.smart_crop(img, 1200, 675)
        assert cropped.size == (1200, 675)
        
        # Test 1:1 crop
        cropped = self.processor.smart_crop(img, 1080, 1080)
        assert cropped.size == (1080, 1080)
    
    def test_resize_logo_maintains_transparency(self, test_logo_path):
        """Test that logo resize preserves alpha channel."""
        logo = Image.open(test_logo_path)
        
        resized = self.processor.resize_logo(logo, 150)
        
        assert resized.mode == 'RGBA'
        assert resized.width <= 150
        assert resized.height <= 150
    
    def test_add_logo_positioning(self, test_image_path, test_logo_path):
        """Test logo positioning in all corners."""
        img = Image.open(test_image_path)
        logo = Image.open(test_logo_path)
        
        positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
        
        for position in positions:
            result = self.processor.add_logo(img, logo, position)
            assert result.size == img.size
            assert result.mode == 'RGB'
    
    def test_add_text_overlay(self, test_image_path):
        """Test text overlay generation."""
        img = Image.open(test_image_path)
        
        result = self.processor.add_text_overlay(
            img,
            title="Test Title",
            cta="Test CTA",
            font_size=90,
            position="center"
        )
        
        assert result.size == img.size
        # mode might be RGB or RGBA depending on implementation but output is usually RGB for JPG
        # My implementation converts to RGB if saving as JPG, but here it returns Image object.
        # Step 996: `img = img.convert("RGB")` in add_text_overlay?
        # Let's check logic. It draws on copy. If original RGB, result RGB.
        assert result.mode == 'RGB'
    
    def test_text_position_variants(self, test_image_path):
        """Test all text position options."""
        img = Image.open(test_image_path)
        
        positions = ['top', 'center', 'bottom']
        
        for position in positions:
            result = self.processor.add_text_overlay(
                img,
                title="Test",
                cta="Click",
                font_size=60,
                position=position
            )
            assert result is not None
    
    def test_generate_asset_complete_workflow(self, test_image_path, test_logo_path, tmp_path):
        """Test complete asset generation."""
        output_path = tmp_path / "output.jpg"
        
        self.processor.generate_asset(
            input_image_path=test_image_path,
            output_path=str(output_path),
            width=1200,
            height=675,
            title="Test Sale 50%",
            cta="Learn More",
            font_size=80,
            text_position="center",
            logo_path=test_logo_path,
            logo_position="top-right",
            logo_size=120
        )
        
        assert output_path.exists()
        
        # Verify output image
        result = Image.open(output_path)
        assert result.size == (1200, 675)
        assert result.format == 'JPEG'
