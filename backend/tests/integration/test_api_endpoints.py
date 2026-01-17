"""Integration tests for API endpoints."""
import pytest
from io import BytesIO
from PIL import Image

class TestGenerateEndpoint:
    """Test /api/generate endpoint."""
    
    def test_generate_with_all_formats(self, client, test_image_path, test_logo_path):
        """Test generating all 4 formats."""
        with open(test_image_path, 'rb') as img_file, \
             open(test_logo_path, 'rb') as logo_file:
            
            response = client.post(
                "/api/generate",
                files={
                    'image': ('test.jpg', img_file, 'image/jpeg'),
                    'logoFile': ('logo.png', logo_file, 'image/png')
                },
                data={
                    'title': 'End of Season Sale 50%',
                    'cta': 'Learn More',
                    'fontSize': '90',
                    'textPosition': 'center',
                    'logoEnabled': 'true',
                    'logoPosition': 'top-right',
                    'logoSize': '150',
                    'formats': '16:9,1:1,9:16,4:5'
                }
            )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data['success'] is True
        assert data['count'] == 4
        assert len(data['assets']) == 4
        
        # Verify each format
        formats = {asset['format'] for asset in data['assets']}
        assert formats == {'16:9', '1:1', '9:16', '4:5'}
    
    def test_generate_with_single_format(self, client, test_image_path):
        """Test generating only one format."""
        with open(test_image_path, 'rb') as img_file:
            response = client.post(
                "/api/generate",
                files={
                    'image': ('test.jpg', img_file, 'image/jpeg')
                },
                data={
                    'title': 'Test',
                    'cta': 'Click',
                    'fontSize': '80',
                    'textPosition': 'top',
                    'logoEnabled': 'false',
                    'formats': '16:9'
                }
            )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data['count'] == 1
        assert data['assets'][0]['format'] == '16:9'
    
    def test_generate_without_logo(self, client, test_image_path):
        """Test generating without logo."""
        with open(test_image_path, 'rb') as img_file:
            response = client.post(
                "/api/generate",
                files={
                    'image': ('test.jpg', img_file, 'image/jpeg')
                },
                data={
                    'title': 'No Logo Test',
                    'logoEnabled': 'false',
                    'formats': '1:1'
                }
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
    
    def test_generate_with_invalid_image(self, client):
        """Test with invalid image file."""
        fake_file = BytesIO(b"not an image")
        
        response = client.post(
            "/api/generate",
            files={
                'image': ('fake.jpg', fake_file, 'image/jpeg')
            },
            data={
                'title': 'Test',
                'formats': '16:9'
            }
        )
        
        assert response.status_code == 500
        data = response.json()
        assert data['success'] is False
        assert 'error' in data
    
    def test_generate_validates_formats(self, client, test_image_path):
        """Test format validation."""
        with open(test_image_path, 'rb') as img_file:
            response = client.post(
                "/api/generate",
                files={
                    'image': ('test.jpg', img_file, 'image/jpeg')
                },
                data={
                    'title': 'Test',
                    'formats': 'invalid-format'
                }
            )
        
        # Should skip invalid format
        assert response.status_code == 200
        data = response.json()
        assert data['count'] == 0
        assert len(data['assets']) == 0

class TestHealthEndpoint:
    """Test health/status endpoints."""
    
    def test_health_check(self, client):
        """Test basic health check."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
