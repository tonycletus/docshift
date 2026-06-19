import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackIcon, LocalIcon, LockDocIcon, OpenCodeIcon } from "@/components/DocIcons";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy - Docshift" },
      {
        name: "description",
        content:
          "How Docshift handles PDFs locally in the browser without uploads, accounts, or a database.",
      },
      { property: "og:title", content: "Privacy - Docshift" },
      {
        property: "og:description",
        content:
          "How Docshift handles PDFs locally in the browser without uploads, accounts, or a database.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[900px] px-6 pb-20 pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <BackIcon className="h-3.5 w-3.5" />
          Back to tools
        </Link>

        <section className="mt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[12px] text-muted-foreground">
            <LocalIcon className="h-3.5 w-3.5" />
            Local-first processing
          </div>
          <h1 className="mt-5 font-display text-[40px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
            What Docshift can see
          </h1>
          <p className="mt-4 max-w-[680px] text-[15px] leading-relaxed text-muted-foreground">
            Docshift is built as a static browser app. When you drop a PDF, the file is handed to
            JavaScript running in your current tab. The app reads the file from browser memory,
            builds the result there, and gives you a local download link.
          </p>
        </section>

        <section className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          <PrivacyCard
            icon={LocalIcon}
            title="Your PDF is not posted"
            body="The tools use File, Blob, canvas, PDF.js, pdf-lib, JSZip, and qpdf WASM in the browser. There is no upload endpoint in the app flow."
          />
          <PrivacyCard
            icon={LockDocIcon}
            title="Passwords stay in the tab"
            body="Protect and Unlock pass the password into local qpdf WASM. The app does not store it, hash it, or send it to a service."
          />
          <PrivacyCard
            icon={OpenCodeIcon}
            title="Hosting serves assets"
            body="A static host serves HTML, CSS, JavaScript, workers, and WASM files. DocShift does not need a database or backend."
          />
        </section>

        <section className="mt-10 space-y-6">
          <Detail
            title="What exists temporarily"
            body="Selected files, previews, and finished outputs exist as browser objects while the tab is open. Resetting a tool or leaving the page releases the object URLs the app created."
          />
          <Detail
            title="What a host may still log"
            body="Static hosting can log normal page requests, such as loading the app shell or a JavaScript file. Those requests are not your PDF contents."
          />
          <Detail
            title="What is deliberately absent"
            body="There is no sign-in system, upload queue, server conversion worker, user database, analytics SDK, ad pixel, or external AI/API call required for the PDF tools."
          />
          <Detail
            title="One practical browser limit"
            body="Very large PDFs use your device memory and CPU. If a browser tab runs out of memory, processing can fail locally without any file leaving the machine."
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}

function PrivacyCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof LocalIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-background p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="mt-4 text-[14px] font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Detail({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-t border-border pt-5">
      <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
