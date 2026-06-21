# Native Releases

This folder contains native release surfaces for DocShift. The web app remains the source of truth for UI and PDF behavior.

- `desktop/` contains the Go/Wails shell that embeds the built React app.
- `../packages/cli/` contains the Node command line package published to npm.

Lovable builds continue to use the root Vite/TanStack app. Native scripts are opt-in and are not required for web deployment.
