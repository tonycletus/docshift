# DocShift CLI

Free, private, open-source PDF tools for browser, desktop, and CLI.

Use DocShift in your browser, on desktop, or from the CLI. No uploads, accounts, subscriptions, or external APIs.

## Install

```bash
npm install -g @tonycletus/docshift
```

```bash
pnpm add -g @tonycletus/docshift
```

macOS/Linux:

```bash
curl -fsSL https://docshift.tonycletus.com/install.sh | sh
```

Windows PowerShell:

```powershell
irm https://docshift.tonycletus.com/install.ps1 | iex
```

## Verify

```bash
docshift version
docshift doctor
```

## Common Commands

```bash
docshift compress input.pdf --preset balanced -o output.pdf
docshift merge a.pdf b.pdf -o combined.pdf
docshift split input.pdf --pages 1-3,5 -o pages.zip
docshift protect input.pdf -p strong-password -o locked.pdf
docshift unlock locked.pdf -p password -o unlocked.pdf
docshift watermark draft.pdf --text DRAFT -o marked.pdf
docshift watermark draft.pdf --image logo.png --opacity 0.22 -o marked.pdf
docshift rotate input.pdf --angle 90 --pages 1-2 -o rotated.pdf
docshift delete-pages input.pdf --pages 2,4 -o trimmed.pdf
docshift extract-pages input.pdf --pages 1,3 -o extracted.pdf
docshift reorder input.pdf --order 3,1,2 -o reordered.pdf
docshift ocr input.pdf -o output.txt
```

Every command supports `--help`:

```bash
docshift --help
docshift compress --help
```

The CLI extracts embedded/selectable PDF text. Scanned-page OCR runs locally in the browser and desktop app.

## Docs

- Full CLI reference: https://docshift.tonycletus.com/cli
- Desktop downloads and release assets: https://github.com/tonycletus/docshift/releases/latest
- Source code: https://github.com/tonycletus/docshift
