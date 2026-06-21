# DocShift Desktop

The desktop app is a Wails shell around the same Vite/TanStack frontend.

Build flow:

1. `npm run build:desktop`
2. `cd native/desktop`
3. `wails build`

`npm run build:desktop` sets `VITE_APP_DESKTOP=true` and copies `dist/client` into `native/desktop/frontend/dist` for Go embedding.
