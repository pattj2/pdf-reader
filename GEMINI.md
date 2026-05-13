# PDF Reader & Highlighter

A professional, feature-rich PDF reading and annotation tool built with **React**, **TypeScript**, and **Vite**. This application is designed for research and active reading, allowing you to capture insights and export them into a structured report.

## 🚀 Key Features

- **🛡️ 100% Serverless Persistence**: 
  - **IndexedDB**: Powered by your browser's native IndexedDB database, allowing it to seamlessly save massive PDF files fully offline.
  - **Browser Fallback**: Highlights and metadata are synchronized with `localStorage` to ensure a snappy library experience. 
  - **SHA-256 Hashing**: Highlights are linked to specific PDFs via unique file hashes, so your notes reappear automatically when you re-open a document.
- **📱 Modern & Responsive UI**: 
  - **Midnight Theme**: A premium dark-mode aesthetic with glassmorphism and subtle glow effects.
  - **Mobile-First Design**: Includes a responsive sidebar drawer and touch-friendly controls for reading on the go.
  - **Clean Typography**: Uses **Outfit** and **Inter** for a professional and legible reading experience.
- **🌓 Adaptive PDF Viewer**: High-performance rendering with `PDF.js`, featuring active page tracking and smooth navigation sync.
- **📄 Printable Reports**: Export your collated highlights into a clean, print-ready "Revised Document" format.

## 🛠️ Technical Stack

- **Frontend**: [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Storage**: Browser native [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via `idb-keyval`)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Orchestration**: [Docker Compose](https://www.docker.com/) for isolated execution of the React App.

## 📂 Project Structure

```text
pdf-reader/
├── src/                 # React UI components and main state (App.tsx)
├── Dockerfile.frontend  # Container configuration for the UI
└── docker-compose.yml   # Full-stack orchestration
```

## 🚥 Quick Start (Docker)

Launch the entire stack with a single command:
```bash
docker compose up -d --build
```
Access the UI at `http://localhost:5173`.

## 🚥 Local Development (Manual)

**Start Frontend**:
```bash
npm install && npm run dev
```

## 📝 Note on Privacy
Your reading data is stored entirely client-side using `IndexedDB` and `localStorage`, meaning your files and reading history never leave your machine!
