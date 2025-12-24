# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **Hugo static site blog served by PocketBase**. The project combines:

1. **Hugo Static Site Generator**: Builds the blog content into static HTML/CSS/JS
2. **PocketBase Backend**: Serves as the web server with embedded static files

### Two-Layer Build Process

The build has two distinct stages that must happen in order:

1. **Content Build**: Hugo generates static files into `pb_public/` directory
2. **Binary Build**: Go compiles `main.go` which embeds `pb_public/` using `//go:embed`

**Critical**: The Hugo build must complete before the Go build, otherwise the embedded filesystem will be stale or empty.

### Static File Embedding

Static files are **embedded into the Go binary** at compile time:
- `//go:embed pb_public/*` directive in `main.go` embeds all Hugo output
- `fs.Sub(staticFiles, "pb_public")` strips the directory prefix for proper routing
- The binary is self-contained and doesn't require `pb_public/` at runtime
- Runtime changes to `pb_public/` won't affect the running binary (files are embedded at build time)

### Directory Structure

```
content/          # Hugo markdown content (blog posts)
config/           # Hugo configuration (hugo.toml)
themes/PaperMod/  # Hugo theme (git submodule)
pb_public/        # Hugo build output (gitignored, embedded into binary)
pb_data/          # PocketBase runtime data/database (gitignored)
main.go           # PocketBase server with embedded static serving
```

## Development Commands

### Building

```bash
# Full build (Hugo + Go binary with embedded files)
make build

# Content only (Hugo static site generation)
make content-build

# Watch mode for content development
make content-watch
```

### Running

```bash
# Build and run server
make run

# Or run directly after building
./pocketbase serve
```

The server defaults to `http://127.0.0.1:8090`

### Cleaning

```bash
# Remove all build artifacts
make clean

# Remove only Hugo output
make content-clean
```

## Hugo Configuration

- **Publish directory**: `pb_public/` (configured in `hugo.toml`)
- **Theme**: PaperMod (git submodule in `themes/PaperMod/`)
- **Output formats**: HTML, RSS, JSON
- **Content**: Markdown files in `content/posts/`

## PocketBase Integration

The PocketBase server (`main.go`) is minimal:
- Creates PocketBase app instance
- Registers a catch-all route `/{path...}` for static file serving
- Uses `apis.Static()` to serve the embedded filesystem
- No custom collections, hooks, or middleware currently configured

To add PocketBase functionality (APIs, collections, hooks), modify `main.go` before `app.Start()`.
