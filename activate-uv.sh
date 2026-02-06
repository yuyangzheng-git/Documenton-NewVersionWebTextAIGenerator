#!/bin/bash

# Quick activation script for uv Python environment
# Usage: source activate-uv.sh

if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✓ Python uv environment activated"
    echo "Python version: $(python --version)"
    echo "pypandoc version: $(python -c 'import pypandoc; print(pypandoc.__version__)')"
else
    echo "❌ .venv not found. Run ./setup-python-uv.sh first"
    exit 1
fi
