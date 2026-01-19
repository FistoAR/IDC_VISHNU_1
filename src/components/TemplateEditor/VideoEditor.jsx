// VideoEditor.jsx - Context-sensitive video editing panel
import { useState, useRef, useEffect, useCallback } from "react";

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
  Replace,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import VideoGalleryModal from "./VideoGalleryModal";


const debounce = (fn, delay = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

const autoPickThumbnailFromVideo = (selectedElement, onUpdate) => {
  if (!selectedElement || selectedElement.tagName !== "VIDEO") return;

  const video = selectedElement;
  const currentTime = video.currentTime;

  const capture = () => {
    requestAnimationFrame(() => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const thumbnailDataUrl = canvas.toDataURL("image/png");
      video.setAttribute("poster", thumbnailDataUrl);

      video.currentTime = currentTime;
      onUpdate?.();
    });
  };

  if (video.readyState >= 2) {
    video.currentTime = Math.min(1, video.duration / 10);
    capture();
  } else {
    video.addEventListener(
      "loadeddata",
      () => {
        video.currentTime = Math.min(1, video.duration / 10);
        capture();
      },
      { once: true }
    );
  }
};

const VideoEditor = ({ selectedElement, onUpdate }) => {
  const fileInputRef = useRef(null);
  const [controlVisibility, setControlVisibility] = useState("always");
  const [openGallery, setOpenGallery] = useState(false);
  const [tab, setTab] = useState("gallery");
  // Set default to true so it is open by default
  const [open, setOpen] = useState(true);
  const coverInputRef = useRef(null);
  const [previewSrc, setPreviewSrc] = useState(null);

  const debouncedUpdate = useRef(
    debounce((...args) => onUpdate?.(...args), 150)
  ).current;

  // Sync previewSrc with selectedElement
  useEffect(() => {
    if (!selectedElement) return;

    if (selectedElement.tagName === "VIDEO") {
      setPreviewSrc(
        selectedElement.currentSrc ||
        selectedElement.src ||
        selectedElement.querySelector("source")?.src ||
        null
      );
    } else if (selectedElement.tagName === "IFRAME") {
      setPreviewSrc(selectedElement.src || null);
    } else {
      setPreviewSrc(null);
    }
  }, [selectedElement]);

  // Keep a ref to access current element inside effects without adding it to dependencies
  const selectedElementRef = useRef(selectedElement);
  selectedElementRef.current = selectedElement;

  // Sync state FROM selectedElement when selection changes
  useEffect(() => {
    if (!selectedElement || selectedElement.tagName !== "VIDEO") return;
    const isHidden = selectedElement.classList.contains("hide-controls");
    setControlVisibility(isHidden ? "hover" : "always");
  }, [selectedElement]);

  // Apply state TO selectedElement (only when controlVisibility changes)
  useEffect(() => {
    const el = selectedElementRef.current;
    if (!el || el.tagName !== "VIDEO") return;

    if (controlVisibility === "always") {
      el.controls = true;
      el.classList.remove("hide-controls");
    } else if (controlVisibility === "hover") {
      el.controls = true;
      el.classList.add("hide-controls");
    }
  }, [controlVisibility]);

  const handleControlVisibilityChange = (value) => {
    if (!selectedElement || selectedElement.tagName !== "VIDEO") return;

    setControlVisibility(value);

    if (value === "always") {
      selectedElement.controls = true;
      selectedElement.classList.remove("hide-controls");
    }

    if (value === "hover") {
      selectedElement.controls = true; // IMPORTANT
      selectedElement.classList.add("hide-controls");
    }

    debouncedUpdate({
      controlsVisibility: value,
    });
  };


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



  const replaceTemplateWithUrl = useCallback((url) => {
    if (!selectedElement || !url) return;
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
    const isDirectVideo = url.match(/\.(mp4|webm|ogg)$/i);
    let newElement;

    if (isYouTube) {
      let embedUrl = url;
      if (url.includes("watch?v="))
        embedUrl = `https://www.youtube.com/embed/${url.split("v=")[1]}`;
      if (url.includes("youtu.be"))
        embedUrl = `https://www.youtube.com/embed/${url.split("/").pop()}`;
      newElement = document.createElement("iframe");
      newElement.src = embedUrl;
      newElement.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      newElement.allowFullscreen = true;
    } else if (isDirectVideo) {
      newElement = document.createElement("video");
      newElement.src = url;
      newElement.controls = true;
    } else {
      newElement = document.createElement("iframe");
      newElement.src = url;
      newElement.allowFullscreen = true;
    }

    newElement.style.width = selectedElement.style.width || "560px";
    newElement.style.height = selectedElement.style.height || "315px";
    selectedElement.replaceWith(newElement);
    debouncedUpdate(newElement);
  }, [selectedElement, debouncedUpdate]);

  const toggleAttribute = useCallback((attr) => {
    if (!selectedElement) return;
    const isEnabled = selectedElement.hasAttribute(attr);
    if (isEnabled) {
      selectedElement.removeAttribute(attr);
    } else {
      selectedElement.setAttribute(attr, "");
    }
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
    debouncedUpdate();
  }, [selectedElement, debouncedUpdate]);

  const hasAttribute = (attr) => selectedElement?.hasAttribute(attr);

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    // Use Object URL for better performance (avoids base64 conversion)
    const videoURL = URL.createObjectURL(file);

    if (selectedElement.tagName === "VIDEO") {
      selectedElement.src = videoURL;
      selectedElement.setAttribute("data-filename", file.name);
      const source = selectedElement.querySelector("source");
      if (source) source.src = videoURL;
      selectedElement.load();

      // Update preview immediately
      setPreviewSrc(videoURL);

      debouncedUpdate();
    }
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;
    if (selectedElement.tagName !== "VIDEO") {
      alert("Cover image works only for video files");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      selectedElement.setAttribute("poster", result);
      setPosterSrc(result);
      debouncedUpdate();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* SECTION HEADER WITH TOGGLE */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-3 py-2 font-medium bg-white border-b border-gray-100"
      >
        <div className="flex items-center gap-2">
          <VideoIcon size={18} />
          <span>Video</span>
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* COLLAPSIBLE CONTENT */}
      {open && (
        <div className="space-y-4 p-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-800">
              Upload your Video
            </h3>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4"
            onChange={handleVideoUpload}
            className="hidden"
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleCoverUpload}
          />

          <div className="flex gap-4 items-center">
            <div className="w-18 h-18 border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
              {previewSrc ? (
                <video
                  src={previewSrc}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              ) : (
                <div className="text-xs text-gray-400">No Video</div>
              )}
            </div>
            <div className="text-gray-400">
              <Replace size={20} />
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 w-30 h-18 border-2 border-dashed rounded-lg cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition"
            >
              <Upload size={20} />
              <p className="text-sm text-center">
                Drag & Drop or <span className="font-medium">Upload</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-right">
            Supported File Format: MP4
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">URL :</label>
            <input
              type="text"
              placeholder="http://"
              className="flex-1 px-3 py-2 border  rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
              onBlur={(e) => replaceTemplateWithUrl(e.target.value)}
            />
          </div>

          {/* GALLERY PREVIEW BOX */}
          <div
            onClick={() => setOpenGallery(true)}
            className="relative w-full h-28 border rounded-md cursor-pointer overflow-hidden bg-gray-50 mt-4"
          >
            {/* Preview thumbnails */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
              {galleryPreviews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-full h-full object-cover opacity-50"
                />
              ))}
            </div>


            {/* Overlay content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full bg-black/40 hover:bg-black/50 transition-colors">
              <div className="flex items-center gap-2 text-white">
                <VideoIcon size={16} />
                <p className="text-sm font-medium">Video Gallery</p>
              </div>
            </div>
          </div>

          {/* PLAYBACK SETTINGS */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-gray-700">
                Playback Settings
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-600">
                Autoplay (playback automatically)
              </p>
              <button
                onClick={() => toggleAttribute("autoplay")}
                className={`w-10 h-5 flex items-center rounded-full p-1 transition ${hasAttribute("autoplay") ? "bg-indigo-600" : "bg-gray-300"
                  }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full transition-transform ${hasAttribute("autoplay") ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-600">
                Loop (repeat continuously)
              </p>
              <button
                onClick={() => toggleAttribute("loop")}
                className={`w-10 h-5 flex items-center rounded-full p-1 transition ${hasAttribute("loop") ? "bg-indigo-600" : "bg-gray-300"
                  }`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full transition-transform ${hasAttribute("loop") ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          </div>

          {/* VISIBILITY CONTROLS */}
          <div className="mt-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Control Button Visibility
            </h3>
            <div className="flex items-center bg-gray-50 gap-2" />
            <div className="space-y-2">
              <label className="flex items-center gap-4 cursor-pointer mt-2">
                <input
                  type="radio"
                  name="visibility"
                  checked={controlVisibility === "always"}
                  onChange={() => handleControlVisibilityChange("always")}
                  className="accent-indigo-600"
                />
                <span className="text-xs text-gray-700">Always Visible</span>
              </label>
              <label className="flex items-center gap-4 cursor-pointer mt-2">
                <input
                  type="radio"
                  name="visibility"
                  checked={controlVisibility === "hover"}
                  onChange={() => handleControlVisibilityChange("hover")}
                  className="accent-indigo-600"
                />
                <span className="text-xs text-gray-700">Show on Hover</span>
              </label>
            </div>
          </div>

          {/* COVER IMAGE */}
          <div className="bg-white rounded-lg p-3">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Cover Image Upload Options
              </h3>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="flex items-start justify-between gap-6">
              {/* LEFT OPTIONS */}
              <div className="space-y-4">
                <label className="flex items-center gap-3 mt-3 cursor-pointer">
                  <input
                    type="radio"
                    name="cover"
                    onChange={() => coverInputRef.current?.click()}
                    className="accent-indigo-600"
                  />
                  <span className="text-xs text-gray-700">
                    Upload from your File
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="cover"
                    onChange={() =>
                      autoPickThumbnailFromVideo(selectedElement, debouncedUpdate)
                    }
                    className="accent-indigo-600"
                  />
                  <span className="text-xs text-gray-700">
                    Auto Pick from video
                  </span>
                </label>
              </div>

              {/* RIGHT UPLOAD BOX */}
              <div
                onClick={() => coverInputRef.current?.click()}
                className="w-36 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-600 transition"
              >
                {selectedElement?.poster ? (
                  <img
                    src={selectedElement.poster}
                    alt="Cover"
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <>
                    <Upload size={14} />
                    <p className="text-xs text-center mt-1">File Format : JPG, PNG</p>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* GALLERY MODAL */}
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
  );
};

export default VideoEditor;
