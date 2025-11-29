#!/bin/bash

# Navigate to the script directory
cd "$(dirname "$0")"

echo "🚀 Starting Prompt Engineering Studio..."

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo "⚠️  Killing process on port $port (PID: $pid)"
        kill -9 $pid
        sleep 1
    fi
}

# Kill processes on ports 8000 and 5173 if they exist
kill_port 8000
kill_port 5173

echo "✅ Ports cleared"

# Start backend server
echo "🔧 Starting backend server on port 8000..."
PYTHONPATH=$(pwd) python src/api_server.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

# Open browser
echo "🌐 Opening browser..."
open http://localhost:5173

echo ""
echo "✨ Application started successfully!"
echo "📊 Backend:  http://localhost:8000"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
wait
