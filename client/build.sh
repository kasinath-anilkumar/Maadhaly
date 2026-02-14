#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Building frontend..."
npm exec -- vite build

echo "Build complete!"
