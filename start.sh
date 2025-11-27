#!/bin/bash

# LLM Council - Start script

# Load configuration from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Default port if not set
BACKEND_PORT=${BACKEND_PORT:-8002}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

echo "Starting LLM Council..."
echo ""

# Start backend
echo "Starting backend on http://localhost:$BACKEND_PORT..."
uv run python -m backend.main &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "Starting frontend on http://localhost:$FRONTEND_PORT..."
cd frontend
VITE_API_PORT=$BACKEND_PORT npm run dev &
FRONTEND_PID=$!

echo ""
echo "✓ LLM Council is running!"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
