#!/usr/bin/env bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
STATIK_GREEN='\033[38;2;0;191;99m'  # #00bf63
NC='\033[0m'

REPO_URL="https://raw.githubusercontent.com/snehendu098/statik-uptime/main"
CLI_URL="$REPO_URL/validator/scripts/statik-cli.sh"
INSTALL_DIR="/usr/local/bin"
CLI_NAME="statik"

echo -e "${STATIK_GREEN}"
cat << "EOF"
   _____ __        __  _ __
  / ___// /_____ _/ /_(_) /__
  \__ \/ __/ __ `/ __/ / //_/
 ___/ / /_/ /_/ / /_/ / ,<
/____/\__/\__,_/\__/_/_/|_|

Statik Validator Installer
EOF
echo -e "${NC}"

# Check if running on macOS or Linux
OS="$(uname -s)"
case "$OS" in
    Darwin*)
        OS_TYPE="mac"
        ;;
    Linux*)
        OS_TYPE="linux"
        ;;
    *)
        echo -e "${RED}ERROR: Unsupported OS: $OS${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}Checking prerequisites...${NC}"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed${NC}"
    echo -e "${YELLOW}Please install Docker Desktop:${NC}"
    if [ "$OS_TYPE" = "mac" ]; then
        echo "  https://docs.docker.com/desktop/install/mac-install/"
    else
        echo "  https://docs.docker.com/desktop/install/linux-install/"
    fi
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}ERROR: Docker daemon is not running${NC}"
    echo -e "${YELLOW}Please start Docker Desktop${NC}"
    exit 1
fi

echo -e "${GREEN}SUCCESS: Docker is installed and running${NC}"

# Check for jq
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}WARNING: jq is not installed. Installing...${NC}"
    if [ "$OS_TYPE" = "mac" ]; then
        if command -v brew &> /dev/null; then
            brew install jq
        else
            echo -e "${RED}ERROR: Homebrew not found. Please install jq manually:${NC}"
            echo "  brew install jq"
            exit 1
        fi
    else
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y jq
        elif command -v yum &> /dev/null; then
            sudo yum install -y jq
        else
            echo -e "${RED}ERROR: Please install jq manually${NC}"
            exit 1
        fi
    fi
fi

echo -e "${GREEN}SUCCESS: jq is installed${NC}"

# Setup validator directory
VALIDATOR_HOME="$HOME/.statik/validator"
mkdir -p "$VALIDATOR_HOME"

# Download CLI script
echo -e "${BLUE}Installing Statik CLI...${NC}"

# For local development, copy from current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_SCRIPT="$SCRIPT_DIR/statik-cli.sh"

if [ -f "$CLI_SCRIPT" ]; then
    # Local installation (for development)
    echo -e "${BLUE}Installing from local files...${NC}"
    sudo cp "$CLI_SCRIPT" "$INSTALL_DIR/$CLI_NAME"

    # Copy validator files
    VALIDATOR_DIR="$(dirname "$SCRIPT_DIR")"
    if [ -f "$VALIDATOR_DIR/Dockerfile" ]; then
        cp "$VALIDATOR_DIR/Dockerfile" "$VALIDATOR_HOME/"
        cp "$VALIDATOR_DIR/.dockerignore" "$VALIDATOR_HOME/" 2>/dev/null || true
        cp "$VALIDATOR_DIR/package.json" "$VALIDATOR_HOME/" 2>/dev/null || true
        cp "$VALIDATOR_DIR/bun.lockb" "$VALIDATOR_HOME/" 2>/dev/null || true
        cp -r "$VALIDATOR_DIR/src" "$VALIDATOR_HOME/" 2>/dev/null || true
        cp "$VALIDATOR_DIR/index.ts" "$VALIDATOR_HOME/" 2>/dev/null || true
        cp "$VALIDATOR_DIR/account.ts" "$VALIDATOR_HOME/" 2>/dev/null || true
        cp "$VALIDATOR_DIR/types.ts" "$VALIDATOR_HOME/" 2>/dev/null || true
        cp "$VALIDATOR_DIR/tsconfig.json" "$VALIDATOR_HOME/" 2>/dev/null || true
    fi
else
    # Remote installation (for production)
    echo -e "${BLUE}Downloading from GitHub...${NC}"
    sudo curl -fsSL "$CLI_URL" -o "$INSTALL_DIR/$CLI_NAME"

    # Download validator files
    echo -e "${BLUE}Downloading validator files...${NC}"
    curl -fsSL "$REPO_URL/validator/Dockerfile" -o "$VALIDATOR_HOME/Dockerfile"
    curl -fsSL "$REPO_URL/validator/.dockerignore" -o "$VALIDATOR_HOME/.dockerignore"
    curl -fsSL "$REPO_URL/validator/package.json" -o "$VALIDATOR_HOME/package.json"
    curl -fsSL "$REPO_URL/validator/index.ts" -o "$VALIDATOR_HOME/index.ts"
    curl -fsSL "$REPO_URL/validator/account.ts" -o "$VALIDATOR_HOME/account.ts"
    curl -fsSL "$REPO_URL/validator/types.ts" -o "$VALIDATOR_HOME/types.ts"
    curl -fsSL "$REPO_URL/validator/tsconfig.json" -o "$VALIDATOR_HOME/tsconfig.json"
fi

# Make executable
sudo chmod +x "$INSTALL_DIR/$CLI_NAME"

# Verify installation
if command -v statik &> /dev/null; then
    echo -e "${GREEN}SUCCESS: Statik CLI installed successfully!${NC}"
else
    echo -e "${RED}ERROR: Installation failed${NC}"
    exit 1
fi

# Build Docker image
if [ -f "$VALIDATOR_HOME/Dockerfile" ]; then
    echo -e "${BLUE}Building validator Docker image...${NC}"
    docker build -t statik-validator:latest "$VALIDATOR_HOME"
    echo -e "${GREEN}SUCCESS: Docker image built${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Installation Complete!             ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo ""
echo -e "${YELLOW}Quick Start:${NC}"
echo -e "  1. Create your first validator:"
echo -e "     ${BLUE}statik add main --instances 5${NC}"
echo ""
echo -e "  2. View your validators:"
echo -e "     ${BLUE}statik list${NC}"
echo ""
echo -e "  3. View logs:"
echo -e "     ${BLUE}statik logs main${NC}"
echo ""
echo -e "${YELLOW}More Commands:${NC}"
echo -e "  ${BLUE}statik help${NC}        - Show all available commands"
echo -e "  ${BLUE}statik scale${NC}       - Scale validators up or down"
echo -e "  ${BLUE}statik status${NC}      - Check validator status"
echo ""
echo -e "${YELLOW}Config Location:${NC}"
echo -e "  ~/.statik/"
echo ""
