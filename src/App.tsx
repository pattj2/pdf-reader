import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { get, set, del } from 'idb-keyval';

// Use a more reliable JSDelivr link for the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Highlight {
  id: string;
  text: string;
  page: number;
}

interface FileData {
  fileName?: string;
  lastPage: number;
  highlights: Highlight[];
  updatedAt: number;
}

async function getFileHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'reader'>('landing');
  const [library, setLibrary] = useState<Record<string, FileData>>({});

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [docSubject, setDocSubject] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [fileId, setFileId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<number>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Library Data
  useEffect(() => {
    if (currentView === 'landing') {
      const savedStore = localStorage.getItem('pdf-reader-storage');
      if (savedStore) setLibrary(JSON.parse(savedStore));
    }
  }, [currentView]);

  const scrollToSource = useCallback((pageNumber: number, behavior: ScrollBehavior = 'smooth') => {
    const element = document.getElementById(`page-container-${pageNumber}`);
    if (element) {
      element.scrollIntoView({ behavior, block: 'start' });
    }
  }, []);

  const toggleSelect = (id: string, event: React.MouseEvent | React.ChangeEvent) => {
    event.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteSelected = () => {
    setHighlights(prev => prev.filter(h => !selectedIds.has(h.id)));
    setSelectedIds(new Set());
  };

  const deleteBook = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm('Are you sure you want to completely remove this book and its highlights?')) return;
    
    // Remove from IDB
    await del(`pdf-file-${id}`);
    
    // Remove from LocalStorage
    const savedStore = localStorage.getItem('pdf-reader-storage');
    if (savedStore) {
      const parsed = JSON.parse(savedStore);
      delete parsed[id];
      localStorage.setItem('pdf-reader-storage', JSON.stringify(parsed));
      setLibrary(parsed);
    }
  };

  const loadExistingPdf = async (id: string, data: FileData) => {
    try {
      setFileId(id);
      setSelectedIds(new Set());
      setDocSubject(data.fileName || '');
      
      try {
          const arrayBuffer = await get(`pdf-file-${id}`);
          if (!arrayBuffer) {
              throw new Error("File not found in IndexedDB");
          }
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
      } catch (e) {
          console.warn('Could not load PDF from IndexedDB', e);
          setPdfDoc(null); 
          setNumPages(0);
          alert('PDF file not found locally. It may have been cleared from browser cache. You can re-upload the same file to view your highlights again.');
      }

      setHighlights(data.highlights || []);
      setActivePage(data.lastPage || 1);
      setCurrentView('reader');

      // Scroll after a slight delay
      if (data.lastPage > 1) {
        setTimeout(() => scrollToSource(data.lastPage, 'instant'), 500);
      }
    } catch (e) {
      console.error(e);
      alert('Error loading saved PDF record.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const arrayBuffer = await file.arrayBuffer();
      const hash = await getFileHash(arrayBuffer);
      setFileId(hash);
      setDocSubject(file.name);
      setSelectedIds(new Set());

      // Save PDF array buffer to IndexedDB securely
      await set(`pdf-file-${hash}`, arrayBuffer);

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);

      const savedStore = localStorage.getItem('pdf-reader-storage');
      const storage = savedStore ? JSON.parse(savedStore) : {};
      let fileData: FileData = storage[hash];

      if (fileData) {
        fileData.fileName = file.name;
        // Merge in existing data
        setHighlights(fileData.highlights || []);
        setActivePage(fileData.lastPage || 1);
      } else {
        fileData = { fileName: file.name, lastPage: 1, highlights: [], updatedAt: Date.now() };
        setHighlights([]);
        setActivePage(1);
      }

      setCurrentView('reader');

      // Save initial run
      storage[hash] = fileData;
      localStorage.setItem('pdf-reader-storage', JSON.stringify(storage));

      if (fileData.lastPage > 1) {
        setTimeout(() => scrollToSource(fileData.lastPage, 'instant'), 500);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF. Please check the console for details.');
    }
    
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Sync state to localStorage
  useEffect(() => {
    if (!fileId || currentView !== 'reader') return;

    const savedStore = localStorage.getItem('pdf-reader-storage');
    const storage = savedStore ? JSON.parse(savedStore) : {};
    
    const updatedData = {
      ...(storage[fileId] || {}), // Keep existing fields like fileName if not updated
      lastPage: activePage,
      highlights: highlights,
      updatedAt: Date.now()
    };

    storage[fileId] = updatedData;
    localStorage.setItem('pdf-reader-storage', JSON.stringify(storage));
  }, [fileId, activePage, highlights, currentView]);

  // Track active page using IntersectionObserver
  useEffect(() => {
    if (!pdfDoc || !fileId || currentView !== 'reader') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1');
            setActivePage(pageNum);
          }
        });
      },
      { threshold: [0.1, 0.4, 0.7] }
    );

    const pageElements = document.querySelectorAll('.page-container');
    pageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pdfDoc, numPages, fileId, currentView]);

  const handleHighlight = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const pageContainer = target.closest('.page-container');
    if (!pageContainer) return;

    const pageNumber = parseInt(pageContainer.getAttribute('data-page-number') || '1');
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      const newHighlight: Highlight = {
        id: Date.now().toString(),
        text: text,
        page: pageNumber,
      };
      setHighlights(prev => [...prev, newHighlight]);
      selection?.removeAllRanges();
    }
  };

  const clearHighlights = () => {
    setHighlights([]);
    setSelectedIds(new Set());
  };

  const printRevised = () => {
    window.print();
  };

  if (currentView === 'landing') {
    return (
      <div className="app-container landing-wrapper">
        <SpeedInsights />
        <header className="no-print main-header">
          <div className="header-brand">
            <h1>My Library</h1>
          </div>
          <div className="controls">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="application/pdf" 
              className="hidden-input" 
            />
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
              Upload New Book
            </button>
          </div>
        </header>

        <main className="landing-content">
          <div className="library-grid">
            {Object.keys(library).length === 0 ? (
              <div className="empty-state" style={{gridColumn: '1 / -1'}}>Your library is empty. Upload a PDF to start reading.</div>
            ) : (
              Object.entries(library).sort((a,b) => b[1].updatedAt - a[1].updatedAt).map(([id, data]) => (
                <div key={id} className="book-card" onClick={() => loadExistingPdf(id, data)}>
                  <button 
                      className="delete-book-btn" 
                      onClick={(e) => deleteBook(id, e)}
                      title="Remove from Library"
                  >
                      ×
                  </button>
                  <div className="book-icon">
                    <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                    </svg>
                  </div>
                  <h3 className="book-title">{data.fileName || `Document ${id.substring(0, 8)}`}</h3>
                  <div className="book-meta">
                    <p>Last Read: {new Date(data.updatedAt).toLocaleDateString()}</p>
                    <p>{data.highlights?.length || 0} Highlights</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`} onMouseUp={handleHighlight}>
      <SpeedInsights />
      <header className="no-print main-header">
        <div className="header-brand">
          <button 
            className="mobile-toggle" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle highlights"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1>PDF Reader</h1>
        </div>
        <div className="controls">
          <button className="btn btn-outline" onClick={() => setCurrentView('landing')}>
            &larr; Back to Library
          </button>
          {selectedIds.size > 0 && (
            <button className="btn btn-danger" onClick={deleteSelected}>
              Delete Selected ({selectedIds.size})
            </button>
          )}
          <button className="btn" onClick={clearHighlights}>Clear All</button>
          <button className="btn" onClick={printRevised}>Print Revised</button>
        </div>
      </header>

      <main className="main-content">
        <section className="pdf-section no-print">
          {!pdfDoc && <div className="empty-state">PDF document is loading or could not be found.</div>}
          {pdfDoc && Array.from({ length: numPages }).map((_, i) => (
            <PDFPage key={i} pdfDoc={pdfDoc} pageNumber={i + 1} />
          ))}
        </section>

        <section className={`highlights-section ${isSidebarOpen ? 'active' : ''}`}>
          <div className="print-only report-header">
            <h1 className="report-title">Revised Document</h1>
            <div className="report-meta">
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              {highlights.length > 1 && (
                <p><strong>Subject:</strong> {docSubject || 'Consolidated PDF Highlights'}</p>
              )}
            </div>
            <hr className="report-divider" />
          </div>

          <div className="no-print sidebar-content">
            <div className="sidebar-header">
              <h3 className="sidebar-title">Highlights</h3>
              {pdfDoc && <span className="page-indicator">Page {activePage} of {numPages}</span>}
            </div>
            <div className="subject-container">
              <label className="field-label">
                DOCUMENT SUBJECT (FOR PRINT)
              </label>
              <input 
                type="text" 
                className="subject-input"
                placeholder="e.g. Project Update Report"
                value={docSubject}
                onChange={(e) => setDocSubject(e.target.value)}
              />
            </div>
          </div>

          {highlights.length === 0 && <p className="no-print empty-highlights">Highlight text in the PDF to see it here.</p>}
          <div className="highlights-list">
            {highlights.map(h => (
              <div 
                key={h.id} 
                className={`highlight-item ${selectedIds.has(h.id) ? 'selected' : ''} print-padding-reset`}
                onClick={() => scrollToSource(h.page)}
                title={`Go to page ${h.page}`}
              >
                <input 
                  type="checkbox" 
                  className="highlight-checkbox"
                  checked={selectedIds.has(h.id)}
                  onChange={(e) => toggleSelect(h.id, e)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="highlight-page-badge">
                  PAGE {h.page}
                </div>
                <div className="highlight-text">{h.text}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

interface PageProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
}

const PDFPage: React.FC<PageProps> = ({ pdfDoc, pageNumber }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let renderTask: pdfjsLib.RenderTask | null = null;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        renderTask = page.render(renderContext);
        await renderTask.promise;

        if (isCancelled) return;

        // Render text layer
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = '';
          const textContent = await page.getTextContent();
          
          if (isCancelled) return;
          
          const textLayer = new pdfjsLib.TextLayer({
            textContentSource: textContent,
            container: textLayerRef.current,
            viewport: viewport,
          });
          await textLayer.render();
        }
      } catch (e: any) {
        if (e.name !== 'RenderingCancelledException') {
            console.error("Render Page Error:", e);
        }
      }
    };

    renderPage();
    
    return () => {
        isCancelled = true;
        if (renderTask) {
            renderTask.cancel();
        }
    };
  }, [pdfDoc, pageNumber]);

  return (
    <div 
      id={`page-container-${pageNumber}`} 
      className="page-container" 
      data-page-number={pageNumber}
    >
      <canvas ref={canvasRef} />
      <div ref={textLayerRef} className="textLayer" />
    </div>
  );
};

export default App;
