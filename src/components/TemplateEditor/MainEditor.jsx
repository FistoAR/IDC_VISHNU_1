// MainEditor.jsx - Updated Prop Passing for Double Page & Preview
import React, { useState, useCallback, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import Navbar from '../Navbar';
import ExportModal from '../ExportModal';
import LeftSidebar from './LeftSidebar';
import TopToolbar from './TopToolbar';
import TemplateModal from './TemplateModal';
import HTMLTemplateEditor from './HTMLTemplateEditor';
import FlipbookPreview from './FlipbookPreview';
import RightSidebar from './RightSidebar';
import AlertModal from '../AlertModal';
import useZoom from '../../hooks/useZoom';
import useDeviceDetection from '../../hooks/useDeviceDetection';
import useThumbnail from '../../hooks/useThumbnail';
import useHistory from '../../hooks/useHistory';
import usePreventBrowserZoom from '../../hooks/usePreventBrowserZoom';

const MainEditor = () => {
  // ==================== REFS ====================
  const editorContainerRef = useRef(null);
  const htmlEditorRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const isPotentialDragRef = useRef(false);
  const panStartPosRef = useRef({ x: 0, y: 0 });
  
  // ==================== HOOKS ====================
  usePreventBrowserZoom(); // Block default browser zoom globally
  const deviceInfo = useDeviceDetection();
  const { zoom, zoomIn, zoomOut, setZoomLevel, fitToScreen } = useZoom(100, editorContainerRef);
  const { generateThumbnail, getThumbnail } = useThumbnail();
  const { canUndo, canRedo, undo, redo, saveToHistory } = useHistory();

  // ==================== STATE ====================
  const [showTemplateModal, setShowTemplateModal] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Export Logic
  const handleDownloadPages = async (pagesToExport) => {
      try {
        const PAGE_WIDTH = 595;
        const PAGE_HEIGHT = 842;
        
        // Helper to sanitize filenames
        const sanitizeName = (name) => name.replace(/[^a-z0-9 _-]/gi, '_').replace(/\s+/g, '_');
        const bookNameClean = sanitizeName(pageName) || 'Flipbook';

        if (pagesToExport.length === 1) {
          const pageNum = pagesToExport[0];
          const page = pages.find((p, i) => (i + 1) === pageNum);
          const pageNameClean = sanitizeName(page?.name || `Page_${pageNum}`);
          
          // Single export filename: BookName_PageName.png
          const filename = `${bookNameClean}_${pageNameClean}.png`;

          const hiddenFrame = document.createElement('iframe');
          hiddenFrame.style.width = `${PAGE_WIDTH}px`;
          hiddenFrame.style.height = `${PAGE_HEIGHT}px`;
          hiddenFrame.style.position = 'fixed';
          hiddenFrame.style.top = '-10000px';
          hiddenFrame.style.border = 'none';
          document.body.appendChild(hiddenFrame);
          
          const pageHTML = page?.html || '';
          const doc = hiddenFrame.contentDocument;
          doc.open();
          doc.write(pageHTML);
          doc.close();
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const canvas = await html2canvas(doc.body, {
            scale: 2,
            useCORS: true,
            logging: false,
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            windowWidth: PAGE_WIDTH,
            windowHeight: PAGE_HEIGHT
          });
          
          document.body.removeChild(hiddenFrame);
          
          canvas.toBlob((blob) => {
            saveAs(blob, filename);
          });
          
        } else {
          const zip = new JSZip();
          
          for (const pageNum of pagesToExport) {
             const page = pages.find((p, i) => (i + 1) === pageNum);
             const pageHTML = page?.html || '';
             // Zip entry filename: PageName.png (no book name prefix)
             const pageNameClean = sanitizeName(page?.name || `Page_${pageNum}`);
             
             const hiddenFrame = document.createElement('iframe');
             hiddenFrame.style.width = `${PAGE_WIDTH}px`;
             hiddenFrame.style.height = `${PAGE_HEIGHT}px`;
             hiddenFrame.style.position = 'fixed';
             hiddenFrame.style.top = '-10000px';
             hiddenFrame.style.border = 'none';
             document.body.appendChild(hiddenFrame);
             
             const doc = hiddenFrame.contentDocument;
             doc.open();
             doc.write(pageHTML);
             doc.close();
             
             await new Promise(resolve => setTimeout(resolve, 200));
             
             const canvas = await html2canvas(doc.body, {
                scale: 2,
                useCORS: true,
                logging: false,
                width: PAGE_WIDTH,
                height: PAGE_HEIGHT,
                windowWidth: PAGE_WIDTH,
                windowHeight: PAGE_HEIGHT
             });
             
             document.body.removeChild(hiddenFrame);
             
             const blob = await new Promise(resolve => canvas.toBlob(resolve));
             zip.file(`${pageNameClean}.png`, blob);
          }
          
          const content = await zip.generateAsync({ type: 'blob' });
          saveAs(content, `${bookNameClean}.zip`);
        }
      } catch (err) {
        console.error("Export failed:", err);
        alert("Failed to export pages. Please try again.");
      }
    };
  
  // Template state
  const [templateHTML, setTemplateHTML] = useState('');
  const [pages, setPages] = useState([{ 
    id: 1, 
    name: 'Page 1', 
    html: '',
    thumbnail: null 
  }]);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Editor state
  const [pageName, setPageName] = useState("Untitled Document");
  const [isEditingPageName, setIsEditingPageName] = useState(false);
  const [isDoublePage, setIsDoublePage] = useState(false);
  
  // Panning State
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  // Element selection state
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElementType, setSelectedElementType] = useState(null);

  // Alert State
  const [alertState, setAlertState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'Okay',
    cancelText: 'Cancel',
    onConfirm: null
  });

  const showAlert = useCallback((type, title, message, options = {}) => {
    setAlertState({
      isOpen: true,
      type,
      title,
      message,
      showCancel: options.showCancel || false,
      confirmText: options.confirmText || 'Okay',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm || null
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // ==================== HISTORY TRACKING ====================
  useEffect(() => {
    saveToHistory({ pages, currentPage, pageName });
  }, [pages, currentPage, pageName, saveToHistory]);

  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setPages(previousState.pages);
      setCurrentPage(previousState.currentPage);
      setPageName(previousState.pageName);
      setTemplateHTML(previousState.pages[previousState.currentPage]?.html || '');
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
        setPages(nextState.pages);
        setCurrentPage(nextState.currentPage);
        setPageName(nextState.pageName);
        setTemplateHTML(nextState.pages[nextState.currentPage]?.html || '');
    }
  }, [redo]);

  // ==================== PANNING LOGIC ====================
  useEffect(() => {
    const handleKeyDown = (e) => {
        const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
        if (e.code === 'Space' && !e.repeat && !isInput && !isEditingPageName) {
            e.preventDefault(); 
            setIsSpacePressed(true);
        }
    };
    const handleKeyUp = (e) => {
        if (e.code === 'Space') {
            setIsSpacePressed(false);
            setIsPanning(false);
            isDraggingRef.current = false;
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isEditingPageName]);

  const handleMouseDown = (e) => {
    // Check for middle click (button 1) or background click
    const isMiddleClick = e.button === 1;
    const isBackgroundClick = e.target === editorContainerRef.current && e.button === 0;
    
    
    // Immediate Pan if Space is held OR Middle Mouse
    if (isSpacePressed || isMiddleClick) {
        setIsPanning(true);
        isDraggingRef.current = true;
        lastMousePosRef.current = { x: e.screenX, y: e.screenY };
        e.preventDefault(); 
    } else if (isBackgroundClick) {
        // Delayed Pan for Left Click (wait for movement > 5px)
        isPotentialDragRef.current = true;
        panStartPosRef.current = { x: e.screenX, y: e.screenY };
        lastMousePosRef.current = { x: e.screenX, y: e.screenY };
    }
  };

  const handleMouseMove = (e) => {
    // Check threshold for potential drag (Left click background)
    if (isPotentialDragRef.current && !isDraggingRef.current) {
        const dx = e.screenX - panStartPosRef.current.x;
        const dy = e.screenY - panStartPosRef.current.y;
        if (Math.hypot(dx, dy) > 5) {
            setIsPanning(true);
            isDraggingRef.current = true;
            lastMousePosRef.current = { x: e.screenX, y: e.screenY }; // Sync position to smooth start
        }
    }

    if (isDraggingRef.current && isPanning) {
        const dx = e.screenX - lastMousePosRef.current.x;
        const dy = e.screenY - lastMousePosRef.current.y;
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastMousePosRef.current = { x: e.screenX, y: e.screenY };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPotentialDragRef.current = false;
    // Stop panning mode if space is not held
    if (!isSpacePressed) {
        setIsPanning(false);
    }
  };


  // ==================== TEMPLATE LOADING ====================
  const loadHTMLTemplate = useCallback(async (templatePath) => {
    try {
      const response = await fetch(templatePath);
      const html = await response.text();
      setTemplateHTML(html);
      setPages(prev => {
        const updated = [...prev];
        updated[currentPage] = { ...updated[currentPage], html: html };
        return updated;
      });
      setTimeout(() => generateThumbnail(html, pages[currentPage].id), 500);
    } catch (error) {
      console.error('Failed to load:', error);
      showAlert('error', 'Load Failed', 'Failed to load the selected template. Please try again.');
    }
  }, [currentPage, generateThumbnail, pages]);

  // ==================== PAGE MANAGEMENT ====================
  const switchToPage = useCallback((index) => {
    setPages(prev => {
        const updated = [...prev];
        if (updated[currentPage]) updated[currentPage] = { ...updated[currentPage], html: templateHTML };
        return updated;
    });
    setCurrentPage(index);
    setTemplateHTML(pages[index]?.html || '');
    setSelectedElement(null);
    setSelectedElementType(null);
    setPanOffset({ x: 0, y: 0 }); 
  }, [currentPage, templateHTML, pages]);

  const addNewPage = useCallback((index = null) => {
    const targetIndex = index !== null ? index + 1 : pages.length;
    const newPage = { id: Date.now(), name: `Page ${pages.length + 1}`, html: '', thumbnail: null };
    setPages(prev => {
        const newPages = [...prev];
        newPages.splice(targetIndex, 0, newPage);
        return newPages;
    });
    setCurrentPage(targetIndex);
    setTemplateHTML('');
  }, [pages.length]);

  const duplicatePage = useCallback((index) => {
    const sourceIndex = index !== null ? index : currentPage;
    const sourcePage = pages[sourceIndex];
    if (!sourcePage) return;
    const newPage = { id: Date.now(), name: `${sourcePage.name} (Copy)`, html: sourcePage.html, thumbnail: sourcePage.thumbnail };
    setPages(prev => {
        const newPages = [...prev];
        newPages.splice(sourceIndex + 1, 0, newPage);
        return newPages;
    });
    setCurrentPage(sourceIndex + 1);
    setTemplateHTML(sourcePage.html);
  }, [pages, currentPage]);

  const clearPage = useCallback((index) => {
      showAlert('warning', 'Clear Content', 'Are you sure you want to clear all content from this page?', {
          showCancel: true,
          confirmText: 'Clear Page',
          onConfirm: () => {
             const blankHTML = '';
             setPages(prev => {
                const newPages = [...prev];
                newPages[index] = { ...newPages[index], html: blankHTML, thumbnail: null };
                return newPages;
             });
             if (index === currentPage) setTemplateHTML(blankHTML);
             closeAlert();
          }
      });
  }, [currentPage, showAlert, closeAlert]);

  const deletePage = useCallback((index) => {
    if (pages.length <= 1) { 
        showAlert('warning', 'Action Denied', 'You cannot delete the only page in the document.');
        return; 
    }
    
    showAlert('error', 'Delete Page', 'Are you sure you want to delete this page? This action cannot be undone.', {
        showCancel: true,
        confirmText: 'Delete',
        onConfirm: () => {
            const targetIndex = index ?? currentPage;
            const newPages = pages.filter((_, i) => i !== targetIndex);
            
            // Calculate new current page logic BEFORE setting state to avoid race conditions with rendering
            let newCurrentPage = currentPage;
            if (targetIndex === currentPage) {
                newCurrentPage = Math.max(0, targetIndex - 1);
            } else if (targetIndex < currentPage) {
                newCurrentPage = currentPage - 1;
            }

            setPages(newPages);
            setCurrentPage(newCurrentPage);
            setTemplateHTML(newPages[newCurrentPage]?.html || '');
            closeAlert();
        }
    });
  }, [pages, currentPage, showAlert, closeAlert]);

  // ==================== TEMPLATE EDITING ====================
  const handleTemplateChange = useCallback((newHTML) => {
    setTemplateHTML(newHTML);
    setPages(prev => {
      const updated = [...prev];
      updated[currentPage] = { ...updated[currentPage], html: newHTML };
      return updated;
    });
    generateThumbnail(newHTML, pages[currentPage].id, 2000);
  }, [currentPage, generateThumbnail, pages]);

  const handleElementSelect = useCallback((element, type) => {
    setSelectedElement(element);
    setSelectedElementType(type);
  }, []);

  const handleElementUpdate = useCallback(() => {
    if (selectedElement) {
      const iframe = document.querySelector('iframe');
      if (iframe) {
        const doc = iframe.contentDocument;
        handleTemplateChange(doc.documentElement.outerHTML);
      }
    }
  }, [selectedElement, handleTemplateChange]);

  const openPreview = useCallback(() => {
    setPages(pages.map((page, idx) => idx === currentPage ? { ...page, html: templateHTML } : page));
    setShowPreview(true);
  }, [pages, currentPage, templateHTML]);

  const closePreview = useCallback(() => setShowPreview(false), []);

  const renamePage = useCallback((pageId, newName) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, name: newName } : p));
  }, []);

  // Handle pan start events bubbled up from iframe
  const handleIframePanStart = useCallback((event) => {
    if (event.type === 'space_down') {
        setIsSpacePressed(true);
    } else if (event.type === 'space_up') {
        setIsSpacePressed(false);
        setIsPanning(false);
        isDraggingRef.current = false;
    } else if (event.screenX !== undefined) {
        // It's a mousedown event (middle click or space+click)
        setIsPanning(true);
        isDraggingRef.current = true;
        
        // Use screen coordinates for consistency
        lastMousePosRef.current = { x: event.screenX, y: event.screenY };
    }
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans text-gray-700">
      <Navbar onExport={() => setShowExportModal(true)} />
      <div 
        className="flex flex-1 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
      <LeftSidebar
        pages={pages.map((page, idx) => ({ ...page, thumbnail: getThumbnail(page.id) }))}
        currentPage={currentPage}
        switchToPage={switchToPage}
        addNewPage={() => addNewPage(null)}
        insertPageAfter={addNewPage}
        deletePage={deletePage}
        duplicatePage={duplicatePage}
        clearPage={clearPage}
        renamePage={renamePage}
        onOpenTemplateModal={() => setShowTemplateModal(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 border-r border-gray-200">
        <TopToolbar
          pageName={pageName}
          isEditingPageName={isEditingPageName}
          setPageName={setPageName}
          setIsEditingPageName={setIsEditingPageName}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          zoom={zoom}
          handleZoom={setZoomLevel}
        />

        <div className="flex-1 flex overflow-hidden relative">
          <div 
            ref={editorContainerRef} 
            className={`flex-1 overflow-hidden relative bg-gray-100 flex items-center justify-center p-8 
                ${isSpacePressed ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                // If clicking directly on the background area, deselect
                if (e.target === editorContainerRef.current) {
                    if (htmlEditorRef.current) {
                        htmlEditorRef.current.deselectAll();
                    }
                }
            }}
          >
            <div style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)`, transition: isPanning ? 'none' : 'transform 0.2s ease-out' }}>
                <HTMLTemplateEditor
                    ref={htmlEditorRef}
                    templateHTML={templateHTML}
                    onTemplateChange={handleTemplateChange}
                    pages={pages}
                    currentPage={currentPage}
                    onPageChange={switchToPage}
                    zoom={zoom}
                    onZoomChange={setZoomLevel}
                    onPanStart={handleIframePanStart}
                    onElementSelect={handleElementSelect}
                />
                
                {/* Overlay to capture mouse events during panning */}
                {isPanning && (
                  <div 
                    className="absolute inset-0 z-50 bg-transparent"
                    style={{ cursor: 'grabbing' }}
                  />
                )}
            </div>

            {/* Page Indicator (Fixed Corner) */}
            {pages && pages.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-white/90 text-gray-600 border border-gray-200 text-xs font-medium px-3 py-1.5 rounded-md shadow-sm backdrop-blur-sm z-10 pointer-events-none select-none">
                    Page {currentPage + 1} / {pages.length}
                </div>
            )}
          </div>
        </div>
      </main>

      <RightSidebar
        selectedElement={selectedElement}
        selectedElementType={selectedElementType}
        onUpdate={handleElementUpdate}
        isDoublePage={isDoublePage}
        setIsDoublePage={setIsDoublePage}
        openPreview={openPreview}
      />

      {showTemplateModal && (
        <TemplateModal showTemplateModal={showTemplateModal} setShowTemplateModal={setShowTemplateModal} clearCanvas={() => clearPage(currentPage)} loadHTMLTemplate={loadHTMLTemplate} />
      )}

      {showPreview && (
        <FlipbookPreview 
          pages={pages.map(p => p.html)} 
          pageName={pageName} 
          onClose={closePreview} 
          isMobile={deviceInfo.isMobile}
          isDoublePage={isDoublePage}
        />
      )}

      {/* Custom Alert Modal */}
      <AlertModal 
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        showCancel={alertState.showCancel}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm}
      />

      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        totalPages={pages.length}
        currentPage={currentPage + 1}
        onExport={handleDownloadPages}
        pageName={pageName}
      />
      </div>
    </div>
  );
};

export default MainEditor;