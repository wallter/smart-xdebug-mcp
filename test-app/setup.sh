#!/bin/bash
# Setup script for the Laravel test application
# Run this once to initialize the test environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Smart XDebug MCP Test Application Setup ==="

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose is not available. Please install it first."
    exit 1
fi

# Install Composer dependencies if vendor doesn't exist
if [ ! -d "laravel/vendor" ]; then
    echo "Installing Composer dependencies..."
    docker run --rm -v "$SCRIPT_DIR/laravel:/app" -w /app composer:latest \
        composer install --no-interaction --optimize-autoloader
fi

# Generate app key if not set
if grep -q "APP_KEY=base64:dGhpc2lzYXRlc3RrZXlmb3JkZWJ1Z2dpbmcxMjM0NTY=" laravel/.env 2>/dev/null; then
    echo "Generating application key..."
    docker run --rm -v "$SCRIPT_DIR/laravel:/app" -w /app php:8.3-cli \
        php artisan key:generate --force 2>/dev/null || true
fi

# Start services
echo "Starting Docker services..."
if docker compose version &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if MySQL is ready
echo "Waiting for MySQL..."
for i in {1..30}; do
    if docker exec xdebug-test-db mysqladmin ping -h localhost --silent 2>/dev/null; then
        echo "MySQL is ready!"
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 2
done

# Run migrations
echo "Running database migrations..."
docker exec xdebug-test-app php artisan migrate --force 2>/dev/null || true

# Set permissions
echo "Setting permissions..."
docker exec xdebug-test-app chown -R www-data:www-data /var/www/html/storage 2>/dev/null || true

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Test application is running at: http://localhost:8080"
echo ""
echo "Test endpoints:"
echo "  http://localhost:8080/debug/simple          - Basic variable inspection"
echo "  http://localhost:8080/debug/nested          - Nested data (test JSONPath)"
echo "  http://localhost:8080/debug/exception       - Exception breakpoint"
echo "  http://localhost:8080/debug/loop            - Loop (conditional breakpoint)"
echo "  http://localhost:8080/debug/database        - Database queries"
echo "  http://localhost:8080/debug/user-service    - Service layer (step into/over)"
echo "  http://localhost:8080/debug/async-simulation - State evolution (time-travel)"
echo ""
echo "To trigger XDebug, add XDEBUG_SESSION query parameter:"
echo "  curl 'http://localhost:8080/debug/simple?XDEBUG_SESSION=mcp'"
echo ""
echo "To stop the services:"
echo "  docker compose down"
echo ""
