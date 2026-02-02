# Silex Server (Rust)

A Rust implementation of the Silex website builder server, providing storage and hosting connectors for website management.

## Features

- **Storage Connectors**: Persist website data and assets
  - `FsStorage`: Local filesystem storage
- **Hosting Connectors**: Publish websites
  - `FsHosting`: Local filesystem hosting
- **REST API**: Full API compatibility with the TypeScript implementation
- **Session Management**: Cookie-based sessions (in-memory or Redis)
- **Async Architecture**: Built on Tokio and Axum

## Quick Start

```bash
# Build
cargo build --release

# Run
./target/release/silex-server
```

The server starts on `http://localhost:6805` by default.

## Configuration

Environment variables (or `.env` file):

| Variable | Default | Description |
|----------|---------|-------------|
| `SILEX_URL` | `http://localhost:6805` | Base URL |
| `SILEX_PORT` | `6805` | Port number |
| `SILEX_DATA_PATH` | `./data` | Website storage directory |
| `SILEX_HOSTING_PATH` | `./public` | Publication output directory |
| `SILEX_ASSETS_FOLDER` | `assets` | Assets folder name |
| `SILEX_STATIC_PATH` | *(none)* | Single static directory at "/" |
| `SILEX_STATIC_ROUTES` | *(none)* | Multiple static routes (see below) |

### Serving the Frontend

Two options are available for serving static files. `SILEX_STATIC_ROUTES` takes priority if both are set.

**Option 1: Simple (single directory)**

Use `SILEX_STATIC_PATH` to serve a single directory at "/":

```bash
SILEX_STATIC_PATH=./dist ./target/release/silex-server
```

**Option 2: Advanced (multiple routes)**

Use `SILEX_STATIC_ROUTES` with the format `route:path,route:path`:

```bash
# Serve Silex editor from silex-lib (full configuration with fonts)
SILEX_STATIC_ROUTES="\
/css/files:../../node_modules/@fontsource/ubuntu/files,\
/webfonts:../../node_modules/@fortawesome/fontawesome-free/webfonts,\
/css:../../node_modules/@fortawesome/fontawesome-free/css,\
/:../silex-lib/public,\
/:../silex-lib/dist/client" \
  ./target/release/silex-server
```

**Output:**
```
INFO   /css/files -> node_modules/@fontsource/ubuntu/files
INFO   /webfonts -> node_modules/@fortawesome/fontawesome-free/webfonts
INFO   /css -> node_modules/@fortawesome/fontawesome-free/css
INFO   / -> silex-lib/public
INFO   / -> silex-lib/dist/client
```

The server will:
- Serve fonts from node_modules at `/css/files/` and `/webfonts/`
- Serve FontAwesome CSS from node_modules at `/css/`
- Multiple `/` routes are searched in order (first match wins)
- Fall back to `index.html` for SPA routing
- API routes (`/api/*`) always take precedence

## API Endpoints

### Connectors

```
GET  /api/connector?type=STORAGE|HOSTING     # List connectors
GET  /api/connector/user?type=...            # Get user info
GET  /api/connector/login?type=...           # Start login flow
POST /api/connector/logout?type=...          # Logout
```

### Websites

```
GET    /api/website?websiteId=X              # Read website
GET    /api/website                          # List websites
POST   /api/website?websiteId=X              # Update website
PUT    /api/website                          # Create website
DELETE /api/website?websiteId=X              # Delete website
POST   /api/website/duplicate?websiteId=X    # Duplicate website
```

### Assets

```
GET  /api/website/assets/:path?websiteId=X   # Read asset
POST /api/website/assets?websiteId=X         # Upload assets
```

### Metadata

```
GET  /api/website/meta?websiteId=X           # Get metadata
POST /api/website/meta?websiteId=X           # Update metadata
```

### Publication

```
POST /api/publication?websiteId=X&hostingId=X   # Publish
GET  /api/publication/status?jobId=X            # Check status
```

### Health

```
GET /api/health                              # Health check
```

## Project Structure

```
src/
  main.rs           # Entry point
  lib.rs            # Library exports
  config.rs         # Configuration
  error.rs          # Error types

  connectors/
    mod.rs          # Module exports
    traits.rs       # StorageConnector, HostingConnector traits
    fs_storage.rs   # Filesystem storage
    fs_hosting.rs   # Filesystem hosting
    registry.rs     # Connector registry

  routes/
    mod.rs          # Router setup
    connector.rs    # /api/connector routes
    website.rs      # /api/website routes
    publication.rs  # /api/publication routes

  models/
    mod.rs          # Module exports
    connector.rs    # Connector types
    website.rs      # Website types
    job.rs          # Job tracking types

  services/
    mod.rs          # Module exports
    jobs.rs         # Job manager
    static_files.rs # Static file serving
```

## Development

```bash
# Check compilation
cargo check

# Run tests
cargo test

# Run with debug logging
RUST_LOG=debug cargo run

# Auto-reload on file changes
cargo install cargo-watch
cargo watch -x run
```

## License

AGPL-3.0-or-later
