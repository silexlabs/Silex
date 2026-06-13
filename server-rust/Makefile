FRONTEND_DIST = ../silex-lib/dist/client
DASHBOARD_DIST = ../silex_silex-dashboard-2026/public

.PHONY: dev build test clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

dev: ## Run server (auto-reload on changes)
	SILEX_DASHBOARD_PATH=$(DASHBOARD_DIST) SILEX_STATIC_PATH=$(FRONTEND_DIST) cargo watch -x run

build: ## Build release binary with embedded frontend
	cd ../silex-lib && npm run build
	cargo build --release --features embed-frontend

test: ## Run tests
	cargo test

clean: ## Remove build artifacts
	cargo clean
