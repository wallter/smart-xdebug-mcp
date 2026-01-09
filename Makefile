# Smart XDebug MCP - Development Makefile

.PHONY: install build dev test test-watch coverage lint typecheck clean
.PHONY: test-app-setup test-app-up test-app-down test-app-logs

# Node.js targets
install:
	npm install

build:
	npm run build

dev:
	npm run dev

test:
	npm run test

test-watch:
	npm run test:watch

coverage:
	npm run test:coverage

lint:
	npm run lint

typecheck:
	npm run typecheck

clean:
	npm run clean
	rm -rf node_modules

# Test application targets
test-app-setup:
	cd test-app && chmod +x setup.sh && ./setup.sh

test-app-up:
	cd test-app && docker-compose up -d

test-app-down:
	cd test-app && docker-compose down

test-app-logs:
	cd test-app && docker-compose logs -f app

test-app-rebuild:
	cd test-app && docker-compose down && docker-compose up -d --build

# Full setup
setup: install build test-app-setup
	@echo "Setup complete! Run 'make dev' to start development."

# Integration test
integration-test: build test-app-up
	@echo "Running integration tests..."
	sleep 5
	curl -s 'http://localhost:8080/debug/simple?XDEBUG_SESSION=mcp' || true
	@echo "Integration test complete."
