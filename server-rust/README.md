# Silex Server (Rust)

The server behind Silex Desktop: it serves the Silex frontend and the API it needs, on top of a
directory of websites on the local filesystem.

It is a library, embedded in the desktop app (`desktop/src-tauri`), not a standalone program.

## What it does, and what it does not

The editor is shared with the Silex SaaS, so this crate implements the API that editor expects:
listing websites, reading and writing them, uploading assets, publishing. Where the SaaS talks to a
forge on behalf of many users, this one reads and writes files belonging to the person sitting in
front of the screen.

It knows nothing about the machine it runs on: it starts no process, holds no credentials, and never
leaves its data path. Anything that needs the machine (git, a forge CLI, opening a folder, the
updater) lives in the desktop app, behind Tauri's IPC.

## Website format

One directory per website, shared with the Node server. The split between `website.json` and one
file per page is what makes a website readable in a git diff.

```
data_path/
  {website_id}/
    website.json     # marks the directory as a Silex website
    meta.json        # optional: a website cloned from a forge has none
    assets/
    pages/           # name given by website.json's pagesFolder
      index-abc123.json
    public/          # written by the publication
```

Two rules drive the storage code:

- **Never transform data silently.** What the server does not need to understand is written back
  untouched, so a key added by a GrapesJS plugin survives a save. What it cannot make sense of is an
  explicit error, never a guess.
- **Only validate what the server needs**, which is `pages` and `pagesFolder`. A field that is not
  typed cannot be lost.

## API

```
GET  /api/connector?type=STORAGE|HOSTING       # List connectors (constants)
GET  /api/connector/user?type=STORAGE|HOSTING  # Current user (constants)

GET    /api/website                            # List websites
GET    /api/website?websiteId=X                # Read website
POST   /api/website?websiteId=X                # Update website
PUT    /api/website                            # Create website
DELETE /api/website?websiteId=X                # Delete website
POST   /api/website/duplicate?websiteId=X      # Duplicate website
GET    /api/website/meta?websiteId=X           # Read metadata
POST   /api/website/meta?websiteId=X           # Write metadata

GET  /api/website/assets/:path?websiteId=X     # Read asset
POST /api/website/assets?websiteId=X           # Upload assets

POST /api/publication?websiteId=X              # Publish to the public/ folder
```

The editor sends a `connectorId`, `storageId` or `hostingId` query param on most calls, from the days
when a website could live on several backends. They are accepted and ignored.

Publishing is over by the time the response is sent, so there is no job to poll: the HTTP status is
the result. The editor falls back to a plain success when a server answers no job.

## Configuration

`Config::new(data_path)`, and that is all. The port is the `PORT` constant. The desktop app decides
where the websites live, and lets `SILEX_DATA_PATH` override it.

## Serving the frontend

With the `embed-frontend` feature, the editor (`../dist/client/`) and the dashboard
(`../silex-dashboard-2026/public/`) are compiled into the binary. The dashboard is served at `/`, the
editor at `/?id=<website id>`. Without the feature, the crate serves the API only.

## Project structure

```
src/
  lib.rs           # build_app(), the whole public API with Config
  config.rs        # data path and port
  error.rs         # errors and their HTTP status
  storage.rs       # reading and writing websites
  publish.rs       # writing the published files
  frontend.rs      # embedded editor and dashboard
  models.rs        # website metadata and constants
  routes.rs        # router and shared state
  routes/
    website.rs
    publication.rs
    connector.rs
```

## Development

```bash
cargo check
RUST_LOG=silex_server=debug cargo check
```

The crate has no tests.

## License

AGPL-3.0-or-later
