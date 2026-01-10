// VideoEditor.jsx - Context-sensitive video editing panel
import { useState, useRef } from "react";


import {
  Video as VideoIcon,
  Upload,
  RefreshCw,
  Trash2,
  Sliders,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Repeat,
} from "lucide-react";
import VideoGalleryModal from "./VideoGalleryModal";

const VideoEditor = ({ selectedElement, onUpdate }) => {
  const fileInputRef = useRef(null);

  if (!selectedElement) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        <VideoIcon className="mx-auto mb-2" size={32} />
        <p>Click on a video to edit</p>
      </div>
    );
  }
  const galleryPreviews = [
    "https://www.abcconsultants.in/wp-content/uploads/2023/07/Industrial.jpg",
    "https://www.shutterstock.com/image-photo/engineers-discussing-project-outdoors-industrial-260nw-2624485537.jpg",
    "https://thumbs.dreamstime.com/b/professional-people-workers-working-modern-technology-robotic-industry-automation-manufacturing-engineer-robot-arm-assembly-413769130.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjnXGV5m5a_3qpSA5aZOiTI2cxP12fiECP7A&s",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2X_82Pzp2MyE0HXq_4QFvxUkjSlLByIkpdg&s",
    "https://7409217.fs1.hubspotusercontent-na1.net/hubfs/7409217/Imported_Blog_Media/10556694-scaled.jpg",
  ];

  const replaceTemplateWithUrl = (url) => {
    if (!selectedElement || !url) return;

    // Helper checks
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

    const isDirectVideo = url.match(/\.(mp4|webm|ogg)$/i);

    let newElement;

    // 🎥 YOUTUBE → iframe
    if (isYouTube) {
      let embedUrl = url;

      if (url.includes("watch?v=")) {
        embedUrl = `https://www.youtube.com/embed/${url.split("v=")[1]}`;
      }
      if (url.includes("youtu.be")) {
        embedUrl = `https://www.youtube.com/embed/${url.split("/").pop()}`;
      }

      newElement = document.createElement("iframe");
      newElement.src = embedUrl;
      newElement.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      newElement.allowFullscreen = true;
    }

    // 🎬 DIRECT VIDEO → video tag
    else if (isDirectVideo) {
      newElement = document.createElement("video");
      newElement.src = url;
      newElement.controls = true;
    }

    // 🌐 ANY OTHER URL → iframe fallback
    else {
      newElement = document.createElement("iframe");
      newElement.src = url;
      newElement.allowFullscreen = true;
    }

    // Preserve size
    newElement.style.width = selectedElement.style.width || "560px";
    newElement.style.height = selectedElement.style.height || "315px";

    // Replace template
    selectedElement.replaceWith(newElement);

    // Update editor state
    onUpdate?.(newElement);
  };

  const getCurrentStyle = (property) => {
    if (!selectedElement) return "";
    return window.getComputedStyle(selectedElement)[property] || "";
  };

  const updateStyle = (property, value) => {
    if (!selectedElement) return;
    selectedElement.style[property] = value;
    if (onUpdate) onUpdate();
  };

  const hasAttribute = (attr) => {
    if (!selectedElement) return false;
    return selectedElement.hasAttribute(attr);
  };

const toggleAttribute = (attr) => {
  if (!selectedElement) return;

  // Check current state
  const isEnabled = selectedElement.hasAttribute(attr);

  // Toggle attribute
  if (isEnabled) {
    selectedElement.removeAttribute(attr);
  } else {
    selectedElement.setAttribute(attr, "");
  }

  // Sync the property correctly
  switch (attr) {
    case "autoplay":
      selectedElement.autoplay = !isEnabled;
      break;
    case "loop":
      selectedElement.loop = !isEnabled;
      break;
    case "muted":
      selectedElement.muted = !isEnabled;
      break;
    case "controls":
      selectedElement.controls = !isEnabled;
      break;
    default:
      break;
  }

  // Update editor
  if (onUpdate) onUpdate();
};

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (selectedElement && selectedElement.tagName === "VIDEO") {
        selectedElement.src = event.target.result;
        // Store filename for display
        selectedElement.setAttribute("data-filename", file.name);

        // Optionally update source child if exists (common in HTML5 video)
        const source = selectedElement.querySelector("source");
        if (source) source.src = event.target.result;

        selectedElement.load(); // Reload video to show new source
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
    if (confirm("Delete this video?")) {
      selectedElement.remove();
      if (onUpdate) onUpdate();
    }
  };

  const resetSize = () => {
    if (!selectedElement) return;
    selectedElement.style.width = "";
    selectedElement.style.height = "";
    if (onUpdate) onUpdate();
  };

  // Helper to get display name
  const getDisplayName = () => {
    if (!selectedElement) return "No video selected";
    const filename = selectedElement.getAttribute("data-filename");
    if (filename) return filename;

    const src = selectedElement.currentSrc || selectedElement.src;
    if (!src) return "No source";

    if (src.startsWith("data:")) return "Uploaded Video (Data)";
    return src.split("/").pop();
  };
  const [openGallery, setOpenGallery] = useState(false);
  const [tab, setTab] = useState("gallery");

  return (
    <div className="space-y-4">
      {/* Video Preview / Info */}

      <div className="space-y-4 ">
        <div className="flex items-center gap-2 mt-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Upload your Video
          </h3>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Hidden Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4"
          onChange={handleVideoUpload}
          className="hidden"
        />

        {/* Upload UI */}
        <div className="flex gap-4">
          {/* LEFT: VIDEO PREVIEW */}
          <div className="w-28 h-18 border-2 mt-4 border-dashed rounded-lg overflow-hidden bg-gray-50">
            {selectedElement.src ? (
              <video
                src={selectedElement.src}
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">
                No Video
              </div>
            )}
          </div>

          {/* RIGHT: UPLOAD BOX */}
          <div
            onClick={() => {
              fileInputRef.current?.click();
            }}
            className="flex-1 h-28 border-2 border-dashed rounded-lg cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition"
          >
            <Upload size={20} />
            <p className="text-sm text-center ">
              Drag & Drop or <span className="font-medium">Upload</span>
            </p>
          </div>

          {/* OPEN GALLERY */}
          {openGallery && (
            <VideoGalleryModal
              tab={tab}
              setTab={setTab}
              selectedElement={selectedElement}
              onUpdate={onUpdate}
              onClose={() => setOpenGallery(false)}
            />
          )}
        </div>

        <p className="text-xs text-gray-400 ml-30">
          Supported File Format : MP4
        </p>
        {/* OR */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* URL INPUT */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">URL :</label>
          <input
            type="text"
            placeholder="Paste any video URL"
            className="flex-1 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
            onBlur={(e) => replaceTemplateWithUrl(e.target.value)}
          />
        </div>
      </div>
      <div
        onClick={() => setOpenGallery(true)}
        className="relative w-full h-28 border rounded-md cursor-pointer overflow-hidden bg-gray-50"
      >
        {/* BACKGROUND GRID (6 IMAGES) */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <img
              key={i}
              src={galleryPreviews[i]} // replace with your images
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          ))}
        </div>

        {/* OVERLAY CONTENT */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
          <p className=" text-sm text-gray-700 font-medium mt-20">
            Choose from Gallery
          </p>
        </div>
      </div>

      {/* Playback Settings */}
      {/* <div className="space-y-3 pt-3 border-t border-gray-200">
       
        <div className ="flex items-center gap-2">

        <span className="text-xs font-semibold text-gray-700">
          Playback Settings
        </span>
           <div className="flex-1 h-px bg-gray-200 mt-5  mb-5"  />
          </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => toggleAttribute("autoplay")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors ${
              hasAttribute("autoplay")
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            <Play size={14} />
            <span className="text-xs">Autoplay</span>
          </button>

          <button
            onClick={() => toggleAttribute("loop")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors ${
              hasAttribute("loop")
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            <Repeat size={14} />
            <span className="text-xs">Loop</span>
          </button>

          <button
            onClick={() => toggleAttribute("muted")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors ${
              hasAttribute("muted")
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            {hasAttribute("muted") ? (
              <VolumeX size={14} />
            ) : (
              <Volume2 size={14} />
            )}
            <span className="text-xs">Muted</span>
          </button>

          <button
            onClick={() => toggleAttribute("controls")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition-colors ${
              hasAttribute("controls")
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            <Sliders size={14} />
            <span className="text-xs">Controls</span>
          </button>
        </div>
      </div> */}
          
      <div className ="flex items-center gap-2">

        <span className="text-xs font-semibold text-gray-700">
          Playback Settings
        </span>
           <div className="flex-1 h-px bg-gray-200 mt-5  mb-5"  />
          </div>
     <div className="flex items-center justify-between mt-5">
  <div className="text-xs text-gray-600">
    <p>Autoplay(playback video automatically)</p>
  </div>

  {/* Toggle Button */}
<button
  onClick={() => toggleAttribute("autoplay")}
  className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
    hasAttribute("autoplay") ? "bg-indigo-600" : "bg-gray-300"
  }`}
>
  <div
    className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
      hasAttribute("autoplay") ? "translate-x-6" : "translate-x-0"
    }`}
  />
</button>

</div>


     <div className="flex items-center justify-between">
  <div className="text-xs text-gray-600">
    <p>Loop(repeat video Continuously)</p>
  </div>

  {/* Toggle Button */}
<button
  onClick={() => toggleAttribute("loop")}
  className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
    hasAttribute("loop") ? "bg-indigo-600" : "bg-gray-300"
  }`}
>
  <div
    className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
      hasAttribute("loop") ? "translate-x-6" : "translate-x-0"
    }`}
  />
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
                value={
                  parseInt(getCurrentStyle("width")) ||
                  selectedElement?.videoWidth ||
                  0
                }
                onChange={(e) => updateStyle("width", e.target.value + "px")}
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
                value={
                  parseInt(getCurrentStyle("height")) ||
                  selectedElement?.videoHeight ||
                  0
                }
                onChange={(e) => updateStyle("height", e.target.value + "px")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Adjustments */}
      <div className="space-y-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Sliders size={14} />
          <span className="text-xs font-semibold text-gray-700">
            Adjustments
          </span>
        </div>

        {/* Opacity */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600">Opacity</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={parseFloat(getCurrentStyle("opacity") || "1") * 100}
              onChange={(e) => updateStyle("opacity", e.target.value / 100)}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-gray-600 w-12 text-right">
              {Math.round(parseFloat(getCurrentStyle("opacity") || "1") * 100)}%
            </span>
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-600">Border Radius</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="50"
              value={parseInt(getCurrentStyle("borderRadius")) || 0}
              onChange={(e) =>
                updateStyle("borderRadius", e.target.value + "px")
              }
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-gray-600 w-12 text-right">
              {parseInt(getCurrentStyle("borderRadius")) || 0}px
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
