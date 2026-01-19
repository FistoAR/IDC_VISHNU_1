// ImageEditor.jsx - Context-sensitive image editing panel
import React, { useRef } from 'react';
import {
  Image as ImageIcon, Upload, RefreshCw, Crop, Trash2,
  Maximize2, Sliders
} from 'lucide-react';

const ImageEditor = ({ selectedElement, onUpdate }) => {
  const fileInputRef = useRef(null);

  if (!selectedElement) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        <ImageIcon className="mx-auto mb-2" size={32} />
        <p>Click on an image to edit</p>
      </div>
    );
  }

  const getCurrentStyle = (property) => {
    if (!selectedElement) return '';
    return window.getComputedStyle(selectedElement)[property] || '';
  };

  const updateStyle = (property, value) => {
    if (!selectedElement) return;
    selectedElement.style[property] = value;
    if (onUpdate) onUpdate();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (selectedElement && selectedElement.tagName === 'IMG') {
        selectedElement.src = event.target.result;
        if (onUpdate) onUpdate();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    if (!selectedElement) return;
    if (confirm('Delete this image?')) {
      selectedElement.remove();
      if (onUpdate) onUpdate();
    }
  };

  const resetSize = () => {
    if (!selectedElement) return;
    selectedElement.style.width = '';
    selectedElement.style.height = '';
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Image Preview */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <ImageIcon size={14} />
          Image Preview
        </label>
        <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          {selectedElement && selectedElement.src && (
            <img
              src={selectedElement.src}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleReplace}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Upload size={16} />
          Upload / Replace Image
        </button>

        <button
          onClick={resetSize}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw size={16} />
          Reset Size
        </button>

        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium transition-colors"
        >
          <Trash2 size={16} />
          Delete Image
        </button>
      </div>

      {/* Dimensions */}
      <div className="space-y-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">Dimension</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-600">W</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={parseInt(getCurrentStyle('width')) || selectedElement?.naturalWidth || 210}
                onChange={(e) => updateStyle('width', e.target.value + 'px')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-600">H</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={parseInt(getCurrentStyle('height')) || selectedElement?.naturalHeight || 297}
                onChange={(e) => updateStyle('height', e.target.value + 'px')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="10"
              />
            </div>
          </div>
        </div>

        {/* Lock aspect ratio checkbox */}
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            defaultChecked
          />
          Lock aspect ratio
        </label>
      </div>

      {/* Filters & Adjustments */}
      <div className="space-y-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Sliders size={14} />
          <span className="text-xs font-semibold text-gray-700">Adjustments</span>
        </div>

        {/* Opacity */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600">Opacity</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={parseFloat(getCurrentStyle('opacity') || '1') * 100}
              onChange={(e) => updateStyle('opacity', e.target.value / 100)}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-gray-600 w-12 text-right">
              {Math.round(parseFloat(getCurrentStyle('opacity') || '1') * 100)}%
            </span>
          </div>
        </div>

        {/* Brightness */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600">Brightness</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="200"
              defaultValue="100"
              onChange={(e) => {
                const filters = [];
                if (e.target.value !== '100') filters.push(`brightness(${e.target.value}%)`);
                updateStyle('filter', filters.join(' '));
              }}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-gray-600 w-12 text-right">100%</span>
          </div>
        </div>

        {/* Contrast */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600">Contrast</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="200"
              defaultValue="100"
              onChange={(e) => {
                const current = getCurrentStyle('filter');
                const newFilter = `contrast(${e.target.value}%)`;
                updateStyle('filter', current ? `${current} ${newFilter}` : newFilter);
              }}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-gray-600 w-12 text-right">100%</span>
          </div>
        </div>

        {/* Grayscale */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600">Grayscale</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="0"
              onChange={(e) => {
                const current = getCurrentStyle('filter');
                const newFilter = `grayscale(${e.target.value}%)`;
                updateStyle('filter', current ? `${current} ${newFilter}` : newFilter);
              }}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-gray-600 w-12 text-right">0%</span>
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-3 pt-3 border-t border-gray-200">
        <span className="text-xs font-semibold text-gray-700">Border Radius</span>
        
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="50"
              value={parseInt(getCurrentStyle('borderRadius')) || 0}
              onChange={(e) => updateStyle('borderRadius', e.target.value + 'px')}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-gray-600 w-12 text-right">
              {parseInt(getCurrentStyle('borderRadius')) || 0}px
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
