# 🎬 MEDIA STUDIO

[GitHub Repository](https://github.com/Amitro123/media-studio)

> Create stunning social media assets in seconds

An AI-powered platform for generating multi-format social media creatives with custom text overlays and logos.

![Home Screen](screenshots/01-home.png)

***

## ✨ Features

### 🖼️ **From Image**
- Upload your photo
- Add custom text overlays (title + CTA)
- Position text (top/center/bottom)
- Adjust font size dynamically
- **📁 Logo Library - Save and switch between multiple brand logos**
- Add logo with position control (4 corners)
- Adjust logo size dynamically
- Generate 4 social media formats simultaneously

### 📁 **Logo Library** *(New!)*
- Save multiple brand logos (Mako, Keshet, N12, etc.)
- Quick switch between logos
- One-click selection
- Persistent storage (localStorage)
- Delete unwanted logos

### 🎨 **Text-to-Creative**
- Describe your creative with natural language
- AI generates base image
- Edit with same powerful tools
- Regenerate with prompt tweaks

### 📐 **Multi-Format Output**
Generate assets optimized for:
- **16:9** - Facebook Feed (1200×675px)
- **1:1** - Instagram Square (1080×1080px)
- **9:16** - Instagram Story (1080×1920px)
- **4:5** - Facebook/Instagram Portrait (1080×1350px)

### 📤 **Export & Publish**
- Download individual assets
- Bulk download all formats
- Mock publish to social platforms (Facebook, Instagram)

***

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/yourusername/media-studio.git
cd media-studio
```

**2. Install backend dependencies:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**3. Install frontend dependencies:**
```bash
cd ../frontend
npm install
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access the app: http://localhost:5173

***

## 📸 Screenshots

### Home Screen
![Home Screen](screenshots/01-home.png)

### Editor Interface
*New: Logo Library panel for managing multiple brand logos*
![Editor Interface](screenshots/03-editor.png)

### Results & Download
![Results Grid](screenshots/05-results.png)

***

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **Lucide Icons** for UI elements

### Backend
- **FastAPI** for high-performance API
- **Pillow (PIL)** for image processing
- **Python-bidi** for RTL text support
- **Arabic-reshaper** for Arabic text rendering

### Architecture
```text
┌─────────────┐
│   React     │ ← User Interface
│  (Vite)     │
└──────┬──────┘
       │ HTTP
       ↓
┌─────────────┐
│   FastAPI   │ ← Business Logic
│   Backend   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Image      │ ← Image Processing
│  Processor  │   (Pillow)
└─────────────┘
```

***

## 📁 Project Structure

```text
media-studio/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── api/
│   │   └── media_studio.py     # API endpoints
│   ├── services/
│   │   ├── image_processor.py  # Image manipulation
│   │   └── logo_handler.py     # Logo overlay logic
│   └── requirements.txt        # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main application
│   │   ├── main.tsx            # React entry point
│   │   └── index.css           # Global styles
│   ├── package.json            # Node dependencies
│   └── vite.config.ts          # Vite configuration
│
├── screenshots/                # Demo images
├── README.md                   # This file
└── ROADMAP.md                  # Future features
```

***

## 🎯 Current Features Status

| Feature | Status |
|---------|--------|
| Upload Image | ✅ Complete |
| Text-to-Image (Mock) | ✅ Complete |
| Text Overlay | ✅ Complete |
| Logo Upload & Positioning | ✅ Complete |
| Multi-Format Generation | ✅ Complete |
| Download Assets | ✅ Complete |
| Mock Publish | ✅ Complete |
| Responsive Design | ✅ Complete |

***

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and future development.

***

## 🤝 Contributing

This is currently a demo project. For production use:
1. Add real AI image generation (Stable Diffusion/DALL-E)
2. Implement actual social media API integrations
3. Add user authentication
4. Implement history/version control

***

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

***

## 👨‍💻 Author

Built by **Amit Rozanes**

- GitHub: [@Amitro123](https://github.com/Amitro123/media-studio)
- LinkedIn: [Amit Rozanes](#)

***

## 🙏 Acknowledgments

- FastAPI
- React
- Pillow
- Vite

⭐ **If you found this project helpful, consider giving it a star!**
