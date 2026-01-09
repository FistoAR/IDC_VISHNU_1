import { useState } from "react";
import GalleryModal from "./GalleryModal";

export default function VideoPropertiesPanel() {
  const [open, setOpen] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [loop, setLoop] = useState(true);
  const [controlsMode, setControlsMode] = useState("always");
  const [coverMode, setCoverMode] = useState("upload");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  return (
    <div className="w-[280px] bg-white rounded-b-lg border  text-xs overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 font-medium"
      >
        <div className="flex items-center gap-2">
          <span>Video</span>
        </div>
        <span>{open ? "⌃" : "⌄"}</span>
      </button>

      {open && (
        <div className=" px-3 py-3 space-y-4">
          {/* Upload title */}
          <div className="flex items-center gap-2 mt-3">
            <p className="font-medium whitespace-nowrap">Upload your Video</p>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Upload row */}
          <div className="flex gap-2 items-center justify-center mt-3">
            {/* Preview */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-20 h-14 border-2 border-dashed rounded-md relative overflow-hidden">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAslOIdswxvkA6-x7XD0h0tn6CRsyBuaHTmQ&s"
                  className="w-full h-full object-cover"
                  alt=""
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
                  ▶
                </div>
              </div>
              <span className="text-[10px] text-gray-500">Sea port 1</span>
            </div>

            {/* Swap */}
            <div className="m-3 text-gray-400 text-sm">⇄</div>

            {/* Upload box */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-24 h-14 border-2 border-dashed rounded-md flex flex-col items-center justify-center">
                <p className="text-[10px]">Drag & Drop</p>
                <button
                  className="text-blue-600 text-[11px] font-medium"
                  onClick={() => setIsGalleryOpen(true)}
                >
                  Upload
                </button>
                <GalleryModal
                  open={isGalleryOpen}
                  onClose={() => setIsGalleryOpen(false)}
                />
              </div>
              <p className="text-[9px] text-gray-400 text-center">
                Supported File Format : MP4
              </p>
            </div>
          </div>

          {/* OR */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-[10px] text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          <div className="flex gap-2.5">
            <label className="block  m-3 ">URL:</label>
            <input placeholder="https://" className="rounded-lg px-2 py-1" />
          </div>

          {/* Playback */}
          <div className="pt-2  space-y-2">
            {/* Gallery Card */}
            <button className="relative w-full h-[120px] rounded-xl overflow-hidden bg-black group">
              {/* Thumbnails grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-[2px] opacity-70">
                <img
                  src="data:image/jpeg;base64,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"
                  className="w-full h-full object-cover"
                />
                <img
                  src="data:image/jpeg;base64,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"
                  className="w-full h-full object-cover"
                />
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTl-kcLAfTdXako4GYsohOvckhVab6VDjgp0g&s"
                  className="w-full h-full object-cover"
                />
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWfCmplY7gmEJWTuQTp4-oUk0jn3U_xfu5dg&s"
                  className="w-full h-full object-cover"
                />
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhYWdfBRotjP7airuzPlT89KLjXBhxhomXEQ&s"
                  className="w-full h-full object-cover"
                />
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgSYXZzkQglmoMuzYdkVY7ZLXhGrpewHXbfA&s"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/55" />

              {/* Center Content */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-white font-medium mt-20">
                <span>Video Gallery</span>
              </div>
            </button>
            <Toggle
              label="Autoplay (Play video automatically)"
              value={autoplay}
              onChange={setAutoplay}
              activeColor="bg-indigo-600"
            />

            <Toggle
              label="Loop (Repeat video continuously)"
              value={loop}
              onChange={setLoop}
              activeColor="bg-indigo-600"
            />
          </div>

          {/* Controls */}
          <div className="  space-y-2 pt-4 ">
            <p className="font-medium">Control Button Visibility</p>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="controls"
                checked={controlsMode === "always"}
                onChange={() => setControlsMode("always")}
                className="w-4 h-4 accent-indigo-600"
              />
              <span className="text-[11px]">Always Visible</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="controls"
                checked={controlsMode === "hover"}
                onChange={() => setControlsMode("hover")}
                className="w-4 h-4 accent-indigo-600"
              />
              <span className="text-[11px]">Show on Hover</span>
            </label>
          </div>

          {/* Cover image */}
          {/* Cover image */}
          <div className="pt-3 ">
            <div className="flex items-center gap-2 ">
              <p className="font-medium whitespace-nowrap">
                Cover Image Upload Options
              </p>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="flex justify-between items-start gap-4 mt-5">
              {/* Left options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="cover"
                    checked={coverMode === "upload"}
                    onChange={() => setCoverMode("upload")}
                    className="accent-indigo-600"
                  />
                  Upload from your File
                </label>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="cover"
                    checked={coverMode === "auto"}
                    onChange={() => setCoverMode("auto")}
                    className="accent-indigo-600"
                  />
                  Auto Pick from video
                </label>
              </div>

              {/* Right upload box */}
              {coverMode === "upload" && (
                <div className="w-40 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-[10px] text-gray-400">
                  {/* Upload Icon */}
                  <svg
                    className="w-5 h-5 mb-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16V8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                    />
                  </svg>
                  <span>File Format : JPG, PNG</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Toggle */
function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-gray-700">{label}</span>

      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-4 rounded-full p-[2px] transition-colors duration-300
          ${value ? "bg-indigo-600" : "bg-gray-300"}
        `}
      >
        <div
          className={`w-3 h-3 bg-white rounded-full transition-transform duration-300
            ${value ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
}
