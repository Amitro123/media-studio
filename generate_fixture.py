from PIL import Image
import os
try:
    os.makedirs('frontend/e2e/fixtures', exist_ok=True)
    Image.new('RGB', (100,100), 'red').save('frontend/e2e/fixtures/test-image.jpg')
    print("Success")
except Exception as e:
    print(f"Error: {e}")
