import { useState, useRef, useEffect } from "react";
import { X, Upload, Replace } from "lucide-react";

export default function VideoGalleryModal({ open, onClose }) {
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState("gallery");
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) setVisible(true);
    else setTimeout(() => setVisible(false), 200);
  }, [open]);

  if (!open && !visible) return null;

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.includes("image")) {
      alert("Only image files allowed");
      return;
    }

    const url = URL.createObjectURL(file);
    setUploadedImages((prev) => [
      { id: Date.now(), name: file.name, src: url },
      ...prev,
    ]);

    setTab("uploaded");
  };

  const galleryImages = [
    { name: "Sea Port 1", src: "https://picsum.photos/id/100/300/200" },
    { name: "Sea Port 2", src: "https://picsum.photos/id/101/300/200" },
    { name: "Sea Port 3", src: "https://picsum.photos/id/102/300/200" },
    { name: "Cutting Machine", src: "https://picsum.photos/id/103/300/200" },
    { name: "Latte Machine", src: "https://picsum.photos/id/104/300/200" },
    { name: "Operator", src: "https://picsum.photos/id/105/300/200" },
    { name: "Study Materials", src: "https://picsum.photos/id/106/300/200" },
    { name: "Digital Education", src: "https://picsum.photos/id/107/300/200" },
    { name: "Classroom", src: "https://picsum.photos/id/108/300/200" },
    { name: "Graduate", src: "https://picsum.photos/id/109/300/200" },
    { name: "Learning", src: "https://picsum.photos/id/110/300/200" },
    { name: "Homework", src: "https://picsum.photos/id/111/300/200" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div
        className={`bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl transform transition-all duration-200 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* HEADER */}
        <div className="relative flex justify-center border-b">
          <button
            onClick={() => setTab("gallery")}
            className={`px-10 py-5 text-[15px] font-semibold relative ${
              tab === "gallery" ? "text-black" : "text-gray-400"
            }`}
          >
            Video Gallery
            {tab === "gallery" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"></span>
            )}
          </button>

          <button
            onClick={() => setTab("uploaded")}
            className={`px-10 py-5 text-[15px] font-semibold relative ${
              tab === "uploaded" ? "text-black" : "text-gray-400"
            }`}
          >
            Uploaded Videos
            {tab === "uploaded" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"></span>
            )}
          </button>

          <X
            onClick={onClose}
            className="absolute right-6 top-5 cursor-pointer text-gray-400 hover:text-gray-900"
          />
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* TAB: GALLERY */}
          {tab === "gallery" && (
            <>
              <h4 className="text-sm font-semibold mb-5">Recent</h4>
              <div className="grid grid-cols-3 gap-6">
                {galleryImages.map((img) => (
                  <div
                    key={img.name}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className="w-full aspect-square overflow-hidden rounded-2xl shadow-sm border border-gray-200 group-hover:shadow-md transition">
                      <img
                        src={img.src}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-[13px] text-gray-700 mt-2 font-medium text-center truncate">
                      {img.name}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TAB: UPLOADED */}
          {tab === "uploaded" && (
            <>
              <h4 className="text-sm font-semibold mb-3">Upload your Video</h4>
              <div
                className="border-2 border-dashed rounded-[24px] p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer mb-10"
                onClick={() => fileInputRef.current.click()}
              >
                <p className="text-sm text-gray-500 mb-2 font-medium">
                  Drag & Drop or{" "}
                  <span className="text-indigo-600 underline font-semibold">
                    Upload
                  </span>
                </p>
                <Upload size={30} className="text-gray-500 mb-2" />
                <p className="text-xs text-gray-400 font-medium">
                  File Size : 30 MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={handleUpload}
                />
              </div>

              <h4 className="text-sm font-semibold mb-5">Uploaded Videos</h4>
              {uploadedImages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center">
                  No videos uploaded yet
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <div className="w-full aspect-square overflow-hidden rounded-2xl shadow-sm border border-gray-200 group-hover:shadow-md transition">
                        <img
                          src={img.src}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[13px] text-gray-700 mt-2 font-medium text-center truncate">
                        {img.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t px-8 py-5 flex justify-between items-center">
          <button
            onClick={onClose}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
          >
            <X size={14} /> Close
          </button>
          <button className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800">
            <Replace size={16} /> Replace
          </button>
        </div>
      </div>
    </div>
  );
}