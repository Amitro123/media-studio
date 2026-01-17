#!/bin/bash

echo "🎬 Starting Media Studio Development Servers..."
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Check if dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start backend in background
echo "🔧 Starting FastAPI backend on port 8000..."
cd backend
uvicorn main:app --reload --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
cd ..

# Wait for backend to be ready
sleep 3

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Start frontend (foreground)
echo "🎨 Starting Vite frontend on port 5173..."
echo ""
echo "============================================"
echo "📂 Frontend: http://localhost:5173"
echo "📂 Backend API: http://localhost:8000/docs"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

cd frontend
npm run dev

# Cleanup when frontend exits
cleanup
