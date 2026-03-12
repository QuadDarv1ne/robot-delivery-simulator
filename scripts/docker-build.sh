#!/bin/bash

# Robot Delivery Simulator - Docker Build Script

set -e

VERSION=${1:-latest}
IMAGE_NAME=${2:-robot-simulator}

echo "🐳 Building Docker image: ${IMAGE_NAME}:${VERSION}"

docker build \
    -t ${IMAGE_NAME}:${VERSION} \
    -t ${IMAGE_NAME}:latest \
    -f docker/Dockerfile \
    .

echo "✅ Docker image built successfully"
echo ""
echo "To run the container:"
echo "  docker run -p 3000:3000 -p 3003:3003 ${IMAGE_NAME}:${VERSION}"
