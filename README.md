# Docshift

Docshift is a free, local-first PDF toolbox built for fast document work in the browser. Files are processed on the user's device with client-side JavaScript, PDF libraries, and WebAssembly helpers. There is no database, account system, upload queue, or external API required for the core tools.

## Tools

- Compress PDF with distinct Safe, Balanced, and Smaller modes.
- Merge, split, reorder, rotate, delete, and extract PDF pages.
- Add page numbers and watermarks.
- Protect PDFs with an open password and unlock PDFs when the password is known.
- Convert between PDF, JPG, Word, PowerPoint, and Excel where browser-side conversion can produce a useful result.
- Run OCR-style text extraction locally from rendered PDF pages.

## Production Model

- Zero hosting backend cost for the app itself.
- No database or server-side file storage.
- No external API dependency for the document tools.
- Static/client-heavy architecture suitable for Vercel, Lovable, and other static-friendly hosts.
- Temporary build output, local QA files, and dependency folders are ignored from git.

## Local Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```

## Deployment

The project can be hosted on Vercel or Lovable. Use the default install and build commands:

- Install: `npm install`
- Build: `npm run build`
- Preview locally: `npm run preview`

Releases, deployments, and packages are managed from the GitHub repository sidebar when they exist. The app does not need a package registry publish to run in production.
