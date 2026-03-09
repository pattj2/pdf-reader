# PDF Reader & Highlighter

A lightweight, web-based PDF reader designed for active reading and research. This application allows you to upload any PDF, highlight key passages, and automatically collate those highlights into a clean, printable "Revised Version" document.

## 🚀 Features

-   **Seamless PDF Upload:** Open any local PDF file instantly.
-   **Interactive Highlighting:** Simply select text with your mouse to capture it.
-   **Live Sidebar Collation:** Watch your "Revised Version" grow in real-time as you highlight.
-   **Print-Ready Output:** A dedicated print mode that isolates your highlights for a professional, distraction-free summary.
-   **High-Quality Rendering:** Powered by `PDF.js` for crisp text and graphics.

## 🛠️ Tech Stack

-   **Frontend:** React (TypeScript)
-   **Build Tool:** Vite
-   **PDF Engine:** [PDF.js](https://mozilla.github.io/pdf.js/) (by Mozilla)
-   **Styling:** Vanilla CSS3 with Print Media Queries

## 📦 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher recommended)
-   npm (comes with Node.js)

### Installation

1.  Navigate to the project directory:
    ```bash
    cd pdf-reader
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Application

Start the development server:
```bash
npm run dev
```
Open your browser to the URL shown in the terminal (usually `http://localhost:5173`).

## 📖 How to Use

1.  **Open a PDF:** Click the **"Open PDF"** button in the header and select a file from your computer.
2.  **Highlight Text:** Use your mouse to select any text within the PDF. Once you release the mouse button, the text will be automatically added to the sidebar on the right.
3.  **Review Highlights:** All captured text appears in the **"Highlights (Revised Version)"** section.
4.  **Print Your Summary:** Click **"Print Revised"**. This will open your browser's print dialog, showing only your collated highlights in a clean format.

## 🧪 Testing

### Manual Testing Plan

1.  **Loading:** Verify that a PDF loads correctly and all pages are rendered.
2.  **Selection:** Select text across multiple lines to ensure the capture is accurate.
3.  **Collation:** Ensure that every new highlight appears immediately in the sidebar.
4.  **Print Layout:** In the print preview, verify that the PDF viewer, header, and buttons are hidden, leaving only the "Highlights" title and the list of text.
5.  **Empty State:** Verify the app shows a helpful message when no PDF is loaded or no highlights have been made.

## 📝 Note on Prototype

This version is a functional prototype. Highlights are currently held in application state and will be cleared if the page is refreshed. Future versions could include LocalStorage persistence and the ability to add notes to individual highlights.
