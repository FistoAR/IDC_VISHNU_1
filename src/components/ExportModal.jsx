import React, { useState, useEffect } from 'react';
import { Download, X, Loader2 } from 'lucide-react';

// Export Modal Component
const ExportModal = ({ isOpen, onClose, totalPages, currentPage, onExport, pageName }) => {
  const [exportType, setExportType] = useState('current'); // current, all, custom
  const [selectedPages, setSelectedPages] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (exportType === 'custom' && selectedPages.length === 0) {
        setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
      }
    }
  }, [isOpen, exportType, totalPages]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    let pagesToExport = [];
    
    if (exportType === 'current') {
      pagesToExport = [currentPage];
    } else if (exportType === 'all') {
      pagesToExport = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pagesToExport = selectedPages.sort((a, b) => a - b);
    }

    await onExport(pagesToExport);
    setIsExporting(false);
    onClose();
  };

  const togglePage = (pageNum) => {
    if (selectedPages.includes(pageNum)) {
      setSelectedPages(selectedPages.filter(p => p !== pageNum));
    } else {
      setSelectedPages([...selectedPages, pageNum]);
    }
  };

  const toggleAll = () => {
    if (selectedPages.length === totalPages) {
      setSelectedPages([]);
    } else {
      setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 text-left">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Download Pages</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6 space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input 
                type="radio" 
                name="exportType" 
                value="current" 
                checked={exportType === 'current'}
                onChange={(e) => setExportType(e.target.value)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-medium text-gray-900">Current Page</span>
                <p className="text-sm text-gray-500">Download page {currentPage}</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input 
                type="radio" 
                name="exportType" 
                value="all" 
                checked={exportType === 'all'}
                onChange={(e) => setExportType(e.target.value)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-medium text-gray-900">All Pages</span>
                <p className="text-sm text-gray-500">Download whole book as ZIP</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input 
                type="radio" 
                name="exportType" 
                value="custom" 
                checked={exportType === 'custom'}
                onChange={(e) => setExportType(e.target.value)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-medium text-gray-900">Custom Selection</span>
                <p className="text-sm text-gray-500">Select specific pages</p>
              </div>
            </label>
          </div>

          {exportType === 'custom' && (
            <div className="border rounded-lg p-4 bg-gray-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">{selectedPages.length} pages selected</span>
                <button 
                  onClick={toggleAll}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {selectedPages.length === totalPages ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => togglePage(pageNum)}
                    className={`
                      aspect-[1/1.4] rounded text-xs font-medium flex items-center justify-center border transition-all
                      ${selectedPages.includes(pageNum)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm transform scale-105'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}
                    `}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting || (exportType === 'custom' && selectedPages.length === 0)}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? 'Processing...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
