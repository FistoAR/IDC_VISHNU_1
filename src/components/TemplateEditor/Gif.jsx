import { useRef, useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Upload,
  ArrowRightLeft,
  ChevronUp,
  ChevronDown,
  Edit,
} from "lucide-react";
import GalleryGif from "./GalleryGif";

const galleryPreviewImages = [
  "https://images.unsplash.com/photo-1541447271487-09612b3f49f7",
  "https://images.unsplash.com/photo-1517420704212-6804d8c97371",
  "https://images.unsplash.com/photo-1582005131393-545703056094"
];

const GifEditor = ({ selectedElement, onUpdate }) => {
  const fileInputRef = useRef(null);
  const [open, setOpen] = useState(true);
  const [openGallery, setOpenGallery] = useState(false);
  const [opacity, setOpacity] = useState(100);

  // Sync opacity when element changes
  useEffect(() => {
    if (selectedElement) {
      const currentOpacity = selectedElement.style.opacity;
      setOpacity(currentOpacity ? Math.round(Number(currentOpacity) * 100) : 100);
    }
  }, [selectedElement]);

  const handleOpacityChange = (e) => {
    const value = Number(e.target.value);
    setOpacity(value);

    if (selectedElement) {
      selectedElement.style.opacity = value / 100;
      onUpdate?.();
    }
  };

  // 🔒 Always mark selected image as GIF
  useEffect(() => {
    if (
      selectedElement?.tagName === "IMG" &&
      selectedElement.dataset.mediaType !== "gif"
    ) {
      selectedElement.dataset.mediaType = "gif";
    }
  }, [selectedElement]);

  // ✅ Direct GIF upload
  const handleGifUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/gif") {
      alert("Please upload a GIF file");
      return;
    }

    const url = URL.createObjectURL(file);

    if (selectedElement?.tagName === "IMG") {
      if (selectedElement.src?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedElement.src);
      }

      selectedElement.src = url;
      selectedElement.dataset.mediaType = "gif";
      onUpdate?.();
    }
  };

  if (!selectedElement) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        <ImageIcon className="mx-auto mb-2" size={32} />
        <p>Click on a GIF to edit</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border text-left border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
        {/* HEADER */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex justify-between items-center px-4 py-3 font-medium bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="border border-gray-500 rounded p-0.5">
              <Edit size={14} className="text-gray-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">GIF</span>
          </div>
          {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </button>

        {/* CONTENT */}
        {open && (
          <div className="p-4 pt-1 space-y-6 animate-fadeIn">

            {/* 1. Upload Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-bold text-gray-800 whitespace-nowrap">
                  Upload your GIF
                </h3>
                <div className="h-px bg-gray-200 w-full mt-1"></div>
              </div>

              {/* FILE INPUT */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/gif"
                onChange={handleGifUpload}
                className="hidden"
              />

              <div className="flex items-center justify-between gap-2">
                {/* Current Image */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 bg-gray-50 border border-dashed border-gray-400 rounded-lg p-1 flex items-center justify-center overflow-hidden">
                    <img
                      src={selectedElement.src}
                      alt="Current"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">Bulb .GIF</span>
                </div>

                {/* Swap Icon */}
                <div className="flex-shrink-0 text-gray-400">
                  <ArrowRightLeft size={18} />
                </div>

                {/* Upload Area */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-30 h-20 border border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors group"
                  >
                    <Upload size={18} className="text-gray-400 mb-1 group-hover:text-indigo-600 transition-colors" />
                    <p className="text-[10px] text-gray-500">
                      Drag & Drop or <span className="text-indigo-600 font-bold">Upload</span>
                    </p>
                  </div>
                  <span className="text-[9px] text-gray-400 font-medium">Supported File Format : GIF</span>
                </div>
              </div>
            </div>

            {/* 2. Gallery Section */}
            <div
              className="relative h-36 rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => setOpenGallery(true)}
            >
              {/* Background with thumbnails mockup */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 p-4">
                <div className="flex items-end justify-center gap-3 h-full pb-8 opacity-60 grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-105">
                  {galleryPreviewImages.map((src, i) => (
                    <div key={i} className={`rounded shadow-sm overflow-hidden bg-white border border-gray-200 ${i === 1 ? 'w-20 h-20 -mb-2 z-10' : 'w-16 h-16'}`}>
                      <img src={src} alt="Gallery" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex items-end justify-center pb-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
                  <ImageIcon size={18} />
                  GIF Gallery
                </div>
              </div>
            </div>

            {/* 3. Opacity Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-bold text-gray-800">Opacity</h3>
                <div className="h-px bg-gray-200 w-full mt-1"></div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative flex-1 h-2 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    onChange={handleOpacityChange}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <span className="text-sm font-semibold text-gray-800 w-10 text-right">
                  {opacity} %
                </span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* GALLERY MODAL */}
      {openGallery && (
        <GalleryGif
          selectedElement={selectedElement}
          onUpdate={onUpdate}
          onClose={() => setOpenGallery(false)}
        />
      )}
    </>
  );
};

export default GifEditor;
