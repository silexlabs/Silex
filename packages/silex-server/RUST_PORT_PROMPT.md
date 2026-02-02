# Silex Server - TypeScript to Rust Port

## Mission

Port the Silex server from TypeScript/Express.js to Rust.

### Priority 0: Beginner-Friendly
**Absolute priority.** Minimize friction for contributors who are new to Rust:
- Prefer simple, readable code over clever abstractions
- Avoid macros when a function works
- Explicit is better than implicit
- Generous comments explaining "why", not just "what"
- No premature optimization

### Priority 1: Reliability + Maintainability
Fewer bugs, easier maintenance for 1-2 contributors:
- Leverage Rust's type system to catch errors at compile time
- Clear module boundaries, single responsibility
- Consistent patterns across all connectors

### Priority 2: Performance / UX
Better response times, enable server-side publication:
- Async everything (Tokio)
- Efficient streaming for large files
- Background jobs for long operations

---

## Beginner-Friendly Patterns

### Prefer Simple Over Clever
```rust
// BAD: Clever but hard to read for beginners
let result = items.iter().filter_map(|x| x.ok()).collect::<Vec<_>>();

// GOOD: Explicit, easy to understand
let mut result = Vec::new();
for item in items {
    if let Ok(value) = item {
        result.push(value);
    }
}
```

### Avoid Macro Magic
```rust
// BAD: Custom derive macros that hide behavior
#[derive(MyComplexMacro)]
struct Config { ... }

// GOOD: Explicit implementation, even if longer
impl Config {
    pub fn load() -> Result<Self, ConfigError> {
        // Clear, step-by-step logic
    }
}
```

### Comment the "Why"
```rust
// BAD: No context
let timeout = Duration::from_secs(30);

// GOOD: Explains reasoning
// GitLab API can be slow on large repos; 30s matches their UI timeout
let timeout = Duration::from_secs(30);
```

### One File = One Concept
- `fs_storage.rs` - only FsStorage, nothing else
- `oauth.rs` - only OAuth logic
- Keep files under 300 lines when possible

---

## Current Architecture (TypeScript)

### Source Code Locations
- Main server: `packages/silex-lib/src/ts/server/`
- Server plugins: `packages/silex-lib/src/ts/plugins/server/`
- Total: ~6,200 lines of TypeScript

### Express.js Structure
```
server/
  index.ts          # Express app setup, middleware
  connectorApi.ts   # Storage/hosting connector routes
  websiteApi.ts     # Website CRUD operations
  publicationApi.ts # Publication workflow
  jobs.ts           # Async job queue system
  events.ts         # Plugin event system
```

### Connectors (Interfaces)
1. **FsStorage** - Local filesystem storage
2. **FsHosting** - Local filesystem hosting/deployment
3. **FtpConnector** - FTP upload for hosting
4. **GitlabConnector** - GitLab API integration (1,292 lines - most complex)

### Key Characteristics
- Primarily a "pass-through" proxy between client and GitLab API
- Session-based authentication with OAuth
- Async job system for long-running tasks
- Plugin/event system for extensibility
- 400 users/day in production

---

## Target Architecture (Rust)

### Framework Choice: Axum

Use **Axum** for the web framework:
- Built on Tokio (best async runtime)
- Tower middleware ecosystem
- Type-safe extractors
- Better ergonomics than Actix-web for this use case

### Project Structure
```
packages/silex-server/
  Cargo.toml
  src/
    main.rs
    lib.rs
    config.rs           # Configuration loading
    error.rs            # Error types and handling

    routes/
      mod.rs
      connector.rs      # /api/connector/*
      website.rs        # /api/website/*
      publication.rs    # /api/publication/*

    connectors/
      mod.rs
      traits.rs         # StorageConnector, HostingConnector traits
      fs_storage.rs
      fs_hosting.rs
      ftp.rs
      gitlab.rs

    services/
      mod.rs
      jobs.rs           # Async job queue
      events.rs         # Event/plugin system
      session.rs        # Session management
      oauth.rs          # OAuth flow handling

    models/
      mod.rs
      website.rs
      job.rs
      user.rs
```

---

## Rust Traits (Interfaces)

### StorageConnector
```rust
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub is_dir: bool,
    pub size: Option<u64>,
    pub modified: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebsiteData {
    pub id: String,
    pub name: String,
    pub pages: Vec<serde_json::Value>,
    pub styles: Vec<serde_json::Value>,
    pub assets: Vec<serde_json::Value>,
    pub settings: serde_json::Value,
}

#[async_trait]
pub trait StorageConnector: Send + Sync {
    /// Get connector type identifier
    fn connector_type(&self) -> &'static str;

    /// Check if user is authenticated
    async fn is_authenticated(&self, session: &Session) -> Result<bool, ConnectorError>;

    /// Get OAuth authorization URL
    fn get_auth_url(&self, state: &str) -> Option<String>;

    /// Handle OAuth callback
    async fn handle_oauth_callback(
        &self,
        session: &mut Session,
        code: &str,
        state: &str,
    ) -> Result<(), ConnectorError>;

    /// List files/directories
    async fn list(
        &self,
        session: &Session,
        path: &str,
    ) -> Result<Vec<FileInfo>, ConnectorError>;

    /// Read website data
    async fn read_website(
        &self,
        session: &Session,
        path: &str,
    ) -> Result<WebsiteData, ConnectorError>;

    /// Write website data
    async fn write_website(
        &self,
        session: &Session,
        path: &str,
        data: &WebsiteData,
    ) -> Result<(), ConnectorError>;

    /// Delete a file or directory
    async fn delete(
        &self,
        session: &Session,
        path: &str,
    ) -> Result<(), ConnectorError>;
}
```

### HostingConnector
```rust
#[async_trait]
pub trait HostingConnector: Send + Sync {
    /// Get connector type identifier
    fn connector_type(&self) -> &'static str;

    /// Check if user is authenticated
    async fn is_authenticated(&self, session: &Session) -> Result<bool, ConnectorError>;

    /// Get OAuth authorization URL (if needed)
    fn get_auth_url(&self, state: &str) -> Option<String>;

    /// Handle OAuth callback (if needed)
    async fn handle_oauth_callback(
        &self,
        session: &mut Session,
        code: &str,
        state: &str,
    ) -> Result<(), ConnectorError>;

    /// Publish website to hosting
    async fn publish(
        &self,
        session: &Session,
        website: &WebsiteData,
        target_path: &str,
        job_id: &str,
    ) -> Result<PublishResult, ConnectorError>;

    /// Get publication status
    async fn get_status(
        &self,
        session: &Session,
        job_id: &str,
    ) -> Result<PublishStatus, ConnectorError>;
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PublishResult {
    pub url: Option<String>,
    pub job_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum PublishStatus {
    Pending,
    InProgress { progress: u8 },
    Completed { url: String },
    Failed { error: String },
}
```

### Error Handling
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ConnectorError {
    #[error("Not authenticated")]
    NotAuthenticated,

    #[error("Not authorized to access {0}")]
    NotAuthorized(String),

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("OAuth error: {0}")]
    OAuth(String),

    #[error("API error: {code} - {message}")]
    Api { code: u16, message: String },

    #[error("Internal error: {0}")]
    Internal(String),
}

impl axum::response::IntoResponse for ConnectorError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match &self {
            Self::NotAuthenticated => (StatusCode::UNAUTHORIZED, self.to_string()),
            Self::NotAuthorized(_) => (StatusCode::FORBIDDEN, self.to_string()),
            Self::NotFound(_) => (StatusCode::NOT_FOUND, self.to_string()),
            Self::InvalidPath(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            _ => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}
```

---

## Recommended Crates

### Core
```toml
[dependencies]
# Web framework
axum = { version = "0.7", features = ["macros"] }
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace", "compression-gzip"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Async traits
async-trait = "0.1"

# Error handling
thiserror = "1"
anyhow = "1"

# HTTP client (for GitLab API calls)
reqwest = { version = "0.11", features = ["json", "cookies"] }

# Session management
tower-sessions = "0.12"
tower-sessions-redis-store = "0.12"  # For production

# OAuth
oauth2 = "4"

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# Configuration
config = "0.14"
dotenvy = "0.15"

# Time/dates
chrono = { version = "0.4", features = ["serde"] }

# Utilities
uuid = { version = "1", features = ["v4", "serde"] }
```

### Connector-Specific
```toml
# FTP
suppaftp = { version = "6", features = ["async-native-tls"] }

# GitLab (consider building on reqwest rather than using gitlab crate)
# The gitlab crate may be too opinionated; raw reqwest gives more control
```

---

## Porting Order (Progressive)

### Phase 1: Foundation (Week 1)
1. **Project setup** - Cargo.toml, basic Axum app, health check endpoint
2. **Config loading** - Environment variables, config files
3. **Error types** - ConnectorError, API error responses
4. **Session middleware** - Basic session handling

**Deliverable**: Server that starts, responds to `/health`, has session support

### Phase 2: FsStorage (Week 2)
1. **StorageConnector trait** - Define the interface
2. **FsStorage implementation** - Simplest connector, no auth needed
3. **Connector routes** - `/api/connector/list`, `/api/connector/read`

**Deliverable**: Can list local files and read website data

### Phase 3: Website API (Week 3)
1. **Website routes** - CRUD operations
2. **FsHosting** - Local publication
3. **Basic publication flow** - Publish to local filesystem

**Deliverable**: Full local workflow works (create, edit, publish locally)

### Phase 4: Job System (Week 4)
1. **Job queue** - In-memory async job tracking
2. **Job routes** - `/api/jobs/:id`, job status updates
3. **Progress reporting** - WebSocket or polling for job progress

**Deliverable**: Long-running publications tracked via jobs

### Phase 5: FTP Connector (Week 5)
1. **FtpConnector** - HostingConnector implementation
2. **FTP publication** - Upload generated site via FTP

**Deliverable**: Can publish to FTP servers

### Phase 6: GitLab Connector (Weeks 6-8)
1. **OAuth flow** - GitLab OAuth2 authentication
2. **GitLab API client** - Wrapper for GitLab REST API
3. **Storage operations** - List repos, read/write files
4. **Hosting operations** - GitLab Pages publication

**Deliverable**: Full GitLab integration

### Phase 7: Events & Plugins (Week 9)
1. **Event system** - Rust-native event bus
2. **Plugin architecture** - Dynamic loading or compile-time plugins

**Deliverable**: Extensible architecture

### Phase 8: Production Hardening (Week 10+)
1. **Redis sessions** - For horizontal scaling
2. **Rate limiting** - Tower middleware
3. **Metrics** - Prometheus metrics
4. **Documentation** - API docs, deployment guide

---

## Constraints

### API Compatibility
- **Must maintain exact same REST API** as TypeScript version
- Same URL paths, query parameters, request/response bodies
- Client code should work without changes

### Session Handling
- Session data must be compatible or migration path provided
- OAuth state must survive redirects
- Consider session versioning for smooth transition

### OAuth Requirements
- GitLab OAuth flow must work identically
- State parameter must be cryptographically secure
- Token refresh must be handled properly

### File Paths
- Handle Windows vs Unix path separators
- Sanitize paths to prevent directory traversal
- Consistent encoding (UTF-8)

---

## Pitfalls to Avoid

### GitlabConnector Complexity
The GitLab connector is 1,292 lines for good reasons:
- **Pagination** - GitLab API uses pagination; must handle `X-Next-Page` headers
- **Rate limiting** - Respect GitLab rate limits, implement backoff
- **Large files** - GitLab has file size limits; handle chunked uploads
- **Repository creation** - Complex flow with visibility, default branch
- **Subgroups** - GitLab groups/subgroups add path complexity
- **Error mapping** - Map GitLab API errors to meaningful user errors

**Recommendation**: Port GitLab connector last. Test manually with real GitLab projects.

### OAuth State Handling
```rust
// BAD: State in memory only
let state = generate_random_state();
// If server restarts between redirect, state is lost!

// GOOD: State in session or signed cookie
session.insert("oauth_state", &state);
// Or use signed/encrypted state that embeds return URL
```

### Async Pitfalls
```rust
// BAD: Blocking in async context
async fn read_file(path: &str) -> Result<String, Error> {
    std::fs::read_to_string(path)? // Blocks the async runtime!
}

// GOOD: Use async file operations
async fn read_file(path: &str) -> Result<String, Error> {
    tokio::fs::read_to_string(path).await?
}
```

### Error Propagation
```rust
// BAD: Losing error context
let data = client.get(url).await?.json().await?;

// GOOD: Add context
let response = client.get(url).await
    .context("Failed to connect to GitLab API")?;
let data = response.json().await
    .context("Failed to parse GitLab response")?;
```

### Session Type Safety
```rust
// BAD: String keys everywhere
session.get::<String>("gitlab_token")

// GOOD: Typed session data
#[derive(Serialize, Deserialize)]
struct GitlabSession {
    access_token: String,
    refresh_token: Option<String>,
    expires_at: DateTime<Utc>,
}

session.get::<GitlabSession>("gitlab")
```

---

## Migration Path

### Parallel Running
1. Run both TypeScript and Rust servers
2. Proxy some traffic to Rust server
3. Compare responses, log differences
4. Gradually increase Rust traffic percentage

### Feature Flags
```rust
// Start with Rust handling only specific connectors
match connector_type {
    "fs" => rust_handler(req).await,
    _ => proxy_to_typescript(req).await,
}
```

### Database/State Migration
If session store changes:
1. Support reading old session format
2. Write new sessions in new format
3. Old sessions naturally expire

---

## Future: Server-Side Publication

Currently publication happens client-side. Moving it server-side enables:
- **Faster publication** - Server has better network to GitLab
- **Background publication** - User doesn't wait
- **Retry logic** - Server can retry failed uploads
- **Optimization** - Diff-based uploads, only changed files

This is a perfect fit for Rust's async job system.

---

## Commands for Claude Code

When porting module by module, use these commands:

```
# Start with foundation
"Create the Axum project structure with health check endpoint"

# Port a specific connector
"Port FsStorage connector from TypeScript to Rust, implementing StorageConnector trait"

# Port routes
"Port connectorApi routes to Axum, maintaining exact API compatibility"
```

---

## Success Criteria

1. **All existing API endpoints work** - Same requests, same responses
2. **All connectors functional** - Fs, FTP, GitLab
3. **Session compatibility** - Users don't need to re-login
4. **Performance improvement** - Measurable response time reduction
5. **Resource usage** - Lower memory footprint than Node.js
6. **Reliability** - No panics in production, graceful error handling

---

## References

- Current TypeScript source: `packages/silex-lib/src/ts/server/`
- Axum documentation: https://docs.rs/axum
- Tower middleware: https://docs.rs/tower
- GitLab API docs: https://docs.gitlab.com/ee/api/
