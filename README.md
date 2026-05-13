# PDF Reader & Highlighter

A professional, feature-rich web-based PDF Reader explicitly designed for active reading and research. Upload PDFs directly into your browser, highlight important sections visually, and manage your collection using the offline Library dashboard. 

## 🚀 Features

- **Personal PDF Library:** An offline, visual dashboard to organize and review previously read PDFs.
- **Interactive Highlighting:** Highlight text simply by selecting it; automatically tracks the page source.
- **Clean "Revised Version":** Your highlights compile in a sticky sidebar as you read, producing a tailored revision summary for printing.
- **High-Quality Rendering:** Powered by Mozilla's `PDF.js` for fast & accurate document extraction.
- **Space Management:** Quickly delete large unneeded PDFs right from your Library directly via the book card interface.

## 💾 100% Serverless Offline Persistence 

We have modernized the application to abandon fragile backend requirements, making the App pure Javascript:
- **Zero Backend Servers:** The PDF file `ArrayBuffers` are automatically secured securely inside your browser's native robust **IndexedDB** memory structure. They don't leave your computer.
- **Metadata Sync:** Highlights and reading positions are actively cached in `localStorage`.
- **Bulletproof Resilience:** Because the highlights are abstracted separately from the actual PDF files, if your IndexedDB caching gets cleared out, simply dropping the PDF back into the application immediately recovers and restores all of your previous reading progress perfectly!

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Storage Layer:** IndexedDB (via `idb-keyval`) & `localStorage`
- **PDF Engine:** [PDF.js](https://mozilla.github.io/pdf.js/) 

## 🐳 Running with Docker

While the app no longer needs a backend container, a lightweight Docker configuration is maintained for an isolated node development environment.
```bash
docker compose up -d --build
```
Access the Reader at `http://localhost:5173`.

## 🛠️ Manual Development Setup

Since the app relies entirely on native browser features, running the source requires simple Node installation.

**Prerequisites:** [Node.js](https://nodejs.org/) (v18+)

```bash
# Install packages
npm install

# Run the dev server
npm run dev
```

## 📖 How to Use

1. **Upload:** From the Library view, click **"Upload New Book"** to process a standard PDF file.
2. **Review:** To revisit a book, simply click its card on your dashboard.
3. **Capture:** Highlight any words directly within the PDF file reader stream; you will immediately see them populate on the right panel.
4. **Delete Data:** Clear highlights by selectively clicking them, or obliterate the entire document from IndexedDB cleanly via the `×` button.
5. **Print:** Hitting "Print Revised" formats the page as a pristine white paper print layout of exclusively your collected highlights.
