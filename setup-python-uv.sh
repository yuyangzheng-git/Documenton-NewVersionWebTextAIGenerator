#!/bin/bash

# Setup script for Python environment using uv
# This script sets up the Python environment separately from Docker

set -e

echo "================================================"
echo "Python Environment Setup with uv"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if uv is installed
echo -e "${BLUE}Checking for uv installation...${NC}"
if ! command -v uv &> /dev/null; then
    echo -e "${RED}uv is not installed.${NC}"
    echo "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    echo -e "${GREEN}uv installed successfully!${NC}"
else
    echo -e "${GREEN}uv is already installed.${NC}"
    uv --version
fi

echo ""

# Check if pandoc is installed
echo -e "${BLUE}Checking for Pandoc installation...${NC}"
if ! command -v pandoc &> /dev/null; then
    echo -e "${RED}Pandoc is not installed.${NC}"
    echo "Please install Pandoc manually:"
    echo "  macOS:    brew install pandoc"
    echo "  Ubuntu:   sudo apt-get install pandoc"
    echo "  CentOS:   sudo yum install pandoc"
    exit 1
else
    echo -e "${GREEN}Pandoc is installed.${NC}"
    pandoc --version | head -n 1
fi

echo ""

# Create virtual environment
echo -e "${BLUE}Creating Python virtual environment...${NC}"
if [ -d ".venv" ]; then
    echo -e "${RED}Virtual environment already exists.${NC}"
    read -p "Do you want to recreate it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf .venv
        uv venv .venv
        echo -e "${GREEN}Virtual environment recreated.${NC}"
    else
        echo "Using existing virtual environment."
    fi
else
    uv venv .venv
    echo -e "${GREEN}Virtual environment created.${NC}"
fi

echo ""

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source .venv/bin/activate

# Install dependencies
echo -e "${BLUE}Installing Python dependencies with uv...${NC}"
if [ -f "requirements.txt" ]; then
    uv pip install -r requirements.txt
    echo -e "${GREEN}Dependencies installed from requirements.txt${NC}"
else
    echo -e "${RED}No requirements.txt found!${NC}"
    exit 1
fi

echo ""

# Verify installation
echo -e "${BLUE}Verifying Python installation...${NC}"
python --version
echo ""

echo -e "${BLUE}Verifying pypandoc installation...${NC}"
python -c "import pypandoc; print('pypandoc version:', pypandoc.__version__)" || {
    echo -e "${RED}pypandoc import failed!${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Python environment setup complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "To activate the environment in the future, run:"
echo -e "${BLUE}  source .venv/bin/activate${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure your .env.local file"
echo "  2. Start Docker containers: docker-compose -f docker-compose.separated.yml up -d"
echo "  3. Start the application with: npm run dev"
echo ""
