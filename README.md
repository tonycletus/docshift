# DocShift

**Private PDF tools. No uploads.**

Free and open source for browser, desktop, and CLI.

DocShift gives you practical PDF tools for the web app, command line, and desktop. Merge, split, compress, convert, OCR scanned pages, prepare fillable forms, protect, and organize PDFs without accounts, uploads, subscriptions, tracking, or external APIs.

## Tools

- Compress PDF with distinct Safe, Balanced, and Smaller modes.
- Merge, split, reorder, rotate, delete, and extract PDF pages.
- Add page numbers and watermarks.
- Recognize scanned PDF text in the browser and desktop app.
- Prepare fillable forms by detecting likely labels, blank lines, and checkbox cues.
- Protect PDFs with a password and unlock PDFs when the password is known.
- Convert between PDF, JPG, Word, PowerPoint, and Excel where browser-side conversion produces a useful result.
- Extract embedded PDF text from the CLI for scriptable workflows.

## Why DocShift

- Your files never leave your device.
- No account, no email, no sign-up wall.
- No watermarks on output.
- No external API calls for the document tools.
- Static, client-heavy architecture - easy to inspect, easy to host anywhere.

## Local Development

```bash
npm install
npm run dev
```

## CLI

Install the command line tool:

```bash
npm install -g @tonycletus/docshift
```

Verify it:

```bash
docshift version
docshift doctor
```

Run a PDF command:

```bash
docshift compress input.pdf --preset balanced -o output.pdf
docshift merge a.pdf b.pdf -o combined.pdf
docshift protect input.pdf -p strong-password -o locked.pdf
```

Every command supports `--help`. Full CLI docs live at https://docshift.tonycletus.com/cli.

## Checks

```bash
npm run lint
npm run build
```

## Deployment

DocShift is a static, client-side app and can be hosted on any static-friendly host.

- Install: `npm install`
- Build: `npm run build`
- Preview locally: `npm run preview`

## Author

Built by Tony Cletus - [@iamtonycletus](https://x.com/iamtonycletus) - [github.com/tonycletus](https://github.com/tonycletus).
