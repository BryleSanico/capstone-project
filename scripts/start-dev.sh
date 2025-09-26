#!/bin/bash

# Enhanced development startup script for Instagram Clone app
# This script ensures the app works across different networks and locations

set -e

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Start the Instagram Clone app development server with various options"
    echo ""
    echo "OPTIONS:"
    echo "  --help              Show this help message"
    echo "  --no-tunnel         Disable tunnel mode (default: enabled)"
    echo "  --lan               Use LAN mode instead of tunnel"
    echo "  --localhost         Use localhost mode"
    echo "  --no-clear          Skip cache clearing"
    echo "  --web               Open web browser automatically"
    echo "  --force-clear       Clear caches without asking"
    echo ""
    echo "Examples:"
    echo "  $0                  Start with default settings (tunnel mode)"
    echo "  $0 --lan --web      Start in LAN mode and open web browser"
    echo "  $0 --localhost      Start in localhost mode only"
    echo ""
    exit 0
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v bun &> /dev/null; then
        print_error "Bun is not installed. Please install it first."
        print_status "Visit https://bun.sh to install Bun"
        exit 1
    fi

    # Check if expo is available via bunx
    if ! bunx expo --version &> /dev/null; then
        print_error "Expo CLI is not available. Installing..."
        bun install -g @expo/cli
    fi

    print_success "All dependencies are available"
}

# Check network connectivity
check_network() {
    print_status "Checking network connectivity..."

    if ping -c 1 google.com &> /dev/null; then
        print_success "Internet connection is available"
    else
        print_warning "No internet connection detected. Some features may not work."
    fi
}

# Get local IP address
get_local_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        LOCAL_IP=$(hostname -I | awk '{print $1}')
    else
        # Windows (Git Bash)
        LOCAL_IP=$(ipconfig | grep "IPv4" | head -1 | awk '{print $NF}')
    fi

    if [ -n "$LOCAL_IP" ]; then
        print_success "Local IP address: $LOCAL_IP"
    else
        print_warning "Could not determine local IP address"
    fi
}

# Clear caches
clear_caches() {
    print_status "Clearing caches for fresh start..."

    # Clear Metro cache
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        print_success "Cleared Metro cache"
    fi

    # Clear Expo cache using bunx
    bunx expo r -c &> /dev/null || true
    print_success "Cleared Expo cache"

    # Clear React Native cache (if exists)
    if [ -d "/tmp/metro-cache" ]; then
        rm -rf /tmp/metro-cache
        print_success "Cleared React Native cache"
    fi

    # Clear additional caches
    if [ -d ".expo" ]; then
        rm -rf .expo
        print_success "Cleared .expo directory"
    fi

    # Clear bun cache if needed
    if [ -d "node_modules/.bun-cache" ]; then
        rm -rf node_modules/.bun-cache
        print_success "Cleared Bun cache"
    fi
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi

    # Ensure .env.local exists
    if [ ! -f ".env.local" ]; then
        print_warning ".env.local not found. Creating from template..."
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_success "Created .env.local from .env.example"
        else
            touch .env.local
            print_warning "Created empty .env.local file. Please configure your environment variables."
        fi
    fi

    # Validate required environment variables
    if [ -f ".env.local" ]; then
        if ! grep -q "EXPO_PUBLIC_SUPABASE_URL" .env.local; then
            print_warning "EXPO_PUBLIC_SUPABASE_URL not found in .env.local"
        fi
        if ! grep -q "EXPO_PUBLIC_SUPABASE_KEY" .env.local; then
            print_warning "EXPO_PUBLIC_SUPABASE_KEY not found in .env.local"
        fi
    fi

    # Set development environment
    export NODE_ENV=development
    export EXPO_PUBLIC_ENV=development

    print_success "Environment configured"
}

# Start the development server
start_server() {
    print_status "Starting development server..."

    # Default options
    TUNNEL_FLAG="--tunnel"
    CLEAR_FLAG="--clear"
    WEB_FLAG=""
    FORCE_CLEAR=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                ;;
            --no-tunnel)
                TUNNEL_FLAG=""
                shift
                ;;
            --lan)
                TUNNEL_FLAG="--lan"
                shift
                ;;
            --localhost)
                TUNNEL_FLAG="--localhost"
                shift
                ;;
            --no-clear)
                CLEAR_FLAG=""
                shift
                ;;
            --web)
                WEB_FLAG="--web"
                shift
                ;;
            --force-clear)
                FORCE_CLEAR=true
                shift
                ;;
            *)
                print_warning "Unknown option: $1"
                shift
                ;;
        esac
    done

    # Build the command using bunx
    CMD="bunx expo start"

    if [ -n "$CLEAR_FLAG" ]; then
        CMD="$CMD $CLEAR_FLAG"
    fi

    if [ -n "$TUNNEL_FLAG" ]; then
        CMD="$CMD $TUNNEL_FLAG"
    fi

    if [ -n "$WEB_FLAG" ]; then
        CMD="$CMD $WEB_FLAG"
    fi

    print_status "Running: $CMD"
    print_success "Development server starting..."

    if [ -n "$TUNNEL_FLAG" ] && [ "$TUNNEL_FLAG" = "--tunnel" ]; then
        print_status "The app will be accessible from any device on any network via tunnel"
    elif [ -n "$TUNNEL_FLAG" ] && [ "$TUNNEL_FLAG" = "--lan" ]; then
        print_status "The app will be accessible from devices on the same network"
    else
        print_status "The app will be accessible on localhost only"
    fi

    print_status "Scan the QR code with Expo Go or your development build"

    # Execute the command
    eval $CMD
}

# Main execution
main() {
    # Check for help flag first
    for arg in "$@"; do
        if [ "$arg" = "--help" ]; then
            show_help
        fi
    done

    echo "🚀 Starting App Development Server"
    echo "======================================="

    check_dependencies
    check_network
    get_local_ip
    setup_environment

    # Check if force clear is requested
    FORCE_CLEAR=false
    for arg in "$@"; do
        if [ "$arg" = "--force-clear" ]; then
            FORCE_CLEAR=true
            break
        fi
    done

    # Handle cache clearing
    if [ "$FORCE_CLEAR" = true ]; then
        clear_caches
    else
        # Ask user if they want to clear caches (unless --no-clear is specified)
        NO_CLEAR=false
        for arg in "$@"; do
            if [ "$arg" = "--no-clear" ]; then
                NO_CLEAR=true
                break
            fi
        done

        if [ "$NO_CLEAR" = false ]; then
            read -p "Clear caches for fresh start? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                clear_caches
            fi
        fi
    fi

    start_server "$@"
}

# Run main function with all arguments
main "$@"