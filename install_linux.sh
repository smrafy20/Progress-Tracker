#!/bin/bash

# Training PRO - Linux Installation Script
# This script installs all required dependencies for Ubuntu/Debian systems

echo "🚀 Training PRO - Linux Installation Script"
echo "==========================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root. Please run as a regular user."
   exit 1
fi

# Update package list
echo "📦 Updating package list..."
sudo apt update

# Install system dependencies
echo "🔧 Installing system dependencies..."
sudo apt install -y python3 python3-pip redis-server libreoffice libreoffice-java-common

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip3 install -r requirements.txt

# Create upload directories
echo "📁 Creating upload directories..."
mkdir -p uploads uploads_pdf uploads_docx uploads_audio uploads_ppt_images

# Set proper permissions
echo "🔐 Setting directory permissions..."
chmod 755 uploads uploads_pdf uploads_docx uploads_audio uploads_ppt_images

# Start and enable Redis
echo "🔴 Starting Redis server..."
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis connection
echo "🧪 Testing Redis connection..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running successfully!"
else
    echo "❌ Redis connection failed. Please check Redis installation."
    exit 1
fi

# Test LibreOffice installation
echo "🧪 Testing LibreOffice installation..."
if command -v soffice &> /dev/null; then
    echo "✅ LibreOffice is installed successfully!"
    soffice --version
else
    echo "❌ LibreOffice installation failed. Please install manually."
    exit 1
fi

# Test Python dependencies
echo "🧪 Testing Python dependencies..."
python3 -c "
import flask
import redis
import pptx
from PIL import Image
print('✅ All Python dependencies are installed successfully!')
"

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run the application: python3 app.py"
echo "2. Open your browser and go to: http://localhost:5000"
echo "3. Login as instructor or student to get started"
echo ""
echo "📚 For more information, check the README.md file"
