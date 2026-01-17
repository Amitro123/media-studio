from setuptools import setup, find_packages

setup(
    name="media-studio-backend",
    version="1.0.0",
    description="AI-powered social media asset generator - Backend",
    author="Amit Rozanes",
    url="https://github.com/Amitro123/media-studio",
    packages=find_packages(),
    python_requires=">=3.9",
    install_requires=[
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0",
        "pillow>=10.0.0",
        "python-multipart>=0.0.6",
    ],
    license="MIT",
)
