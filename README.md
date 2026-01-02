# Kilo 4 Lab Notebook

Hugo static blog served by PocketBase with embedded files.

## Prerequisites

- **Go** 1.25+ ([installation guide](https://go.dev/doc/install))
- **Hugo** 0.146.0+ ([installation guide](https://gohugo.io/installation/))
- **Make** (included on most Unix systems)
- **Git** (for cloning and submodule management)

## Quick Start

```bash
git submodule update --init --recursive  # Initialize Hugo theme
make build                                # Build Hugo site + Go binary
./pocketbase serve                        # Start server
```

Visit `http://127.0.0.1:8090` for the blog or `http://127.0.0.1:8090/_/` for the admin dashboard.

## Development

```bash
make content-watch    # Auto-rebuild on content changes
make run              # Build and start server
make clean            # Remove build artifacts
```

## Architecture

- **Hugo** generates static files to `pb_public/`
- **Go** embeds `pb_public/` into binary at compile time
- **PocketBase** serves embedded files and provides backend

Content changes require rebuild to update embedded files.

## Server Routes

| Route | Purpose |
|-------|---------|
| `/` | Blog homepage (Hugo static content) |
| `/_/` | PocketBase Admin dashboard |
| `/api/` | REST API base path |
| `/api/health` | Health check endpoint |
| `/api/admins/auth-with-password` | Admin authentication |
| `/api/collections/` | Collection management API |

**Default port**: `http://127.0.0.1:8090`

To change the port or bind address:
```bash
./pocketbase serve --http="0.0.0.0:3000"
```

## Structure

```
content/          # Blog posts (Markdown)
config/           # Hugo config
themes/PaperMod/  # Hugo theme (submodule)
layouts/          # Custom Hugo templates
data/             # Category validation
main.go           # PocketBase server
```

## Deployment

The `pocketbase` binary is self-contained with all static files embedded at build time.

**Basic deployment:**
1. Build the binary: `make build`
2. Copy `pocketbase` to your server
3. Run: `./pocketbase serve`

**Runtime data:**
- PocketBase creates a `pb_data/` directory on first run
- Contains SQLite database and uploaded files
- Backup this directory to preserve data

**Production considerations:**
- Use `--http` flag to bind to appropriate address/port
- Set up systemd service or process manager for auto-restart
- Configure reverse proxy (nginx/caddy) for HTTPS
- Regular backups of `pb_data/` directory
