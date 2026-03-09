import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Use a more reliable JSDelivr link for the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Highlight {
  id: string;
  text: string;
  page: number;
}

const App: React.FC = () => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [numPages, setNumPages] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF. Please check the console for details.');
    }
  };

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

  const scrollToSource = (pageNumber: number) => {
    const element = document.getElementById(`page-container-${pageNumber}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const clearHighlights = () => setHighlights([]);

  const printRevised = () => {
    window.print();
  };

  return (
    <div className="app-container" onMouseUp={handleHighlight}>
      <header>
        <h1>PDF Reader</h1>
        <div className="controls">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="application/pdf" 
            style={{ display: 'none' }} 
          />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            Open PDF
          </button>
          <button className="btn" onClick={clearHighlights}>Clear Highlights</button>
          <button className="btn" onClick={printRevised}>Print Revised</button>
        </div>
      </header>

      <main>
        <section className="pdf-section">
          {!pdfDoc && <div style={{marginTop: '100px'}}>Select a PDF to start reading and highlighting.</div>}
          {pdfDoc && Array.from({ length: numPages }).map((_, i) => (
            <PDFPage key={i} pdfDoc={pdfDoc} pageNumber={i + 1} />
          ))}
        </section>

        <section className="highlights-section">
          <h3>Highlights (Revised Version)</h3>
          {highlights.length === 0 && <p>Highlight text in the PDF to see it here.</p>}
          {highlights.map(h => (
            <div 
              key={h.id} 
              className="highlight-item" 
              onClick={() => scrollToSource(h.page)}
              style={{ cursor: 'pointer' }}
              title={`Go to page ${h.page}`}
            >
              <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>
                PAGE {h.page}
              </div>
              {h.text}
            </div>
          ))}
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
    const renderPage = async () => {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page into canvas context
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Render text layer
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = '';
        const textContent = await page.getTextContent();
        const textLayer = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayerRef.current,
          viewport: viewport,
        });
        await textLayer.render();
      }
    };

    renderPage();
  }, [pdfDoc, pageNumber]);

  return (
    <div 
      id={`page-container-${pageNumber}`} 
      className="page-container" 
      data-page-number={pageNumber}
      style={{ width: 'fit-content' }}
    >
      <canvas ref={canvasRef} />
      <div ref={textLayerRef} className="textLayer" />
    </div>
  );
};

export default App;
