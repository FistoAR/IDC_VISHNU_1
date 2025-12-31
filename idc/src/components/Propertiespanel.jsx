import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

fabric.config = {
  ...fabric.config,
  textCharBounds: true,
};

export default function App() {
  const canvasRef = useRef(null);
  const canvas = useRef(null);
  const imageInputRef = useRef(null);
  const svgInputRef = useRef(null);

  const [layers, setLayers] = useState([]);
  const [activeObj, setActiveObj] = useState(null);

  const [pageSize, setPageSize] = useState({
    width: 794,
    height: 1123,
  });

  const focusObject = (obj) => {
    if (!obj || !canvas.current) return;

    const c = canvas.current;

    // Select object
    c.setActiveObject(obj);

    // Object center
    const center = obj.getCenterPoint();

    // Canvas size
    const canvasWidth = c.getWidth();
    const canvasHeight = c.getHeight();

    // Only pan to center the object (no zoom)
    c.absolutePan({
      x: center.x - canvasWidth / 2,
      y: center.y - canvasHeight / 2,
    });

    c.requestRenderAll();
  };

  const resetView = () => {
    if (!canvas.current) return;

    const c = canvas.current;

    // Reset zoom to 1 (optional, since no zoom is applied)
    c.setZoom(1);

    // Reset pan to origin
    c.viewportTransform = [1, 0, 0, 1, 0, 0];

    c.requestRenderAll();
  };

  // ---------- INIT CANVAS (A4) ----------
  useEffect(() => {
    canvas.current = new fabric.Canvas(canvasRef.current, {
      width: pageSize.width,
      height: pageSize.height,
      backgroundColor: "#fff",
      preserveObjectStacking: true,
    });

    const syncLayers = () => {
      setLayers([...canvas.current.getObjects()].reverse());
      setActiveObj(canvas.current.getActiveObject());
    };

    canvas.current.on("selection:created", syncLayers);
    canvas.current.on("selection:updated", syncLayers);
    canvas.current.on("selection:cleared", () => setActiveObj(null));
    canvas.current.on("object:added", syncLayers);
    canvas.current.on("object:modified", syncLayers);
    canvas.current.on("object:removed", syncLayers);

    return () => canvas.current.dispose();
  }, [pageSize]);
  useEffect(() => {
    if (!canvas.current) return;

    const handleWheel = (e) => {
      if (!e.ctrlKey) return; // only zoom when Ctrl is pressed
      e.preventDefault();

      const c = canvas.current;
      const zoom = c.getZoom();
      const delta = e.deltaY > 0 ? 0.9 : 1.1; // zoom out/in
      let newZoom = zoom * delta;

      // Limit zoom
      newZoom = Math.max(0.2, Math.min(5, newZoom));

      // Zoom relative to mouse pointer
      const pointer = c.getPointer(e);
      c.zoomToPoint({ x: pointer.x, y: pointer.y }, newZoom);

      c.requestRenderAll();
    };

    const canvasContainer = canvasRef.current.parentElement; // container div
    canvasContainer.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvasContainer.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    if (!canvas.current) return;

    const c = canvas.current;
    let isDragging = false;
    let lastPos = { x: 0, y: 0 };
    let movingObj = null;

    const container = canvasRef.current.parentElement;

    const handleMouseDown = (e) => {
      if (e.altKey) {
        // ALT + click → start moving object
        const pointer = c.getPointer(e);
        movingObj = c.findTarget(e, true);
        if (movingObj) {
          isDragging = true;
          lastPos = { x: pointer.x, y: pointer.y };
          c.discardActiveObject();
          movingObj.setCoords();
        }
        container.style.cursor = "move";
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging || !movingObj) return;

      const pointer = c.getPointer(e);
      const dx = pointer.x - lastPos.x;
      const dy = pointer.y - lastPos.y;

      // Move the object
      movingObj.set({
        left: movingObj.left + dx,
        top: movingObj.top + dy,
      });
      movingObj.setCoords();
      c.renderAll();

      lastPos = { x: pointer.x, y: pointer.y };
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        movingObj = null;
        container.style.cursor = "default";
      }
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);
  const uploadImage = (file) => {
    if (!file || !canvas.current) return;

    imageInputRef.current.value = ""; // allow re-upload same image

    const reader = new FileReader();
    reader.onload = () => {
      fabric.Image.fromURL(
        reader.result,
        (img) => {
          const maxW = canvas.current.getWidth() * 0.8;
          const maxH = canvas.current.getHeight() * 0.8;

          const scale = Math.min(maxW / img.width, maxH / img.height, 1);

          img.set({
            left: 100,
            top: 100,
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            evented: true,
            name: file.name || "Image",
          });

          canvas.current.add(img);
          canvas.current.setActiveObject(img);
          canvas.current.renderAll();
          setLayers([...canvas.current.getObjects()].reverse());
        },
        { crossOrigin: "anonymous" }
      );
    };
    reader.readAsDataURL(file);
  };

  const bringToFront = () => {
    if (!activeObj) return;
    canvas.current.bringToFront(activeObj);
    canvas.current.renderAll();
  };

  const sendToBack = () => {
    if (!activeObj) return;
    canvas.current.sendToBack(activeObj);
    canvas.current.renderAll();
  };

  const groupObjects = () => {
    const active = canvas.current.getActiveObject();
    if (!active || active.type !== "activeSelection") return;

    active.toGroup();
    canvas.current.renderAll();
  };

  const ungroupObjects = () => {
    const active = canvas.current.getActiveObject();
    if (!active || active.type !== "group") return;

    active.toActiveSelection();
    canvas.current.renderAll();
  };

  const setBackgroundColor = (color) => {
    if (!canvas.current) return;
    canvas.current.setBackgroundColor(
      color,
      canvas.current.renderAll.bind(canvas.current)
    );
  };

const importTextJSON = async (file) => {
  if (!file || !canvas.current) return;

  const json = JSON.parse(await file.text());
  const c = canvas.current;

  json.texts.forEach((item) => {
    const textbox = new fabric.Textbox(item.value, {
      left: item.x,
      top: item.y,
      width: item.width || 300,

      originX: "center",
      originY: "center",

      fontSize: item.fontSize || 24,
      fill: item.color || "#000",
      textAlign: item.align || "center",

      editable: true,
      selectable: true,
      evented: true,

      name: item.id,
    });

    textbox.setCoords();
    c.add(textbox);
  });

  c.renderAll();
  setLayers([...c.getObjects()].reverse());
};



  // ---------- SVG IMPORT (ADAPT PAGE SIZE ONLY) ----------
 const importSVG = (file) => {
  if (!file || !canvas.current) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    const svgText = e.target.result;
    const c = canvas.current;

    fabric.loadSVGFromString(svgText, (objects, options) => {
      if (!objects || objects.length === 0) {
        alert("SVG file is empty or unsupported");
        return;
      }

      // 1️⃣ Clear canvas safely
      c.clear();
      c.setBackgroundColor("#fff", c.renderAll.bind(c));

      // 2️⃣ Group SVG
      const group = fabric.util.groupSVGElements(objects, options);

      // 3️⃣ Calculate scale to fit canvas
      const canvasW = c.getWidth();
      const canvasH = c.getHeight();

      const scale = Math.min(
        canvasW / group.width,
        canvasH / group.height
      ) * 0.95;

      // 4️⃣ Center SVG on canvas
      group.set({
        scaleX: scale,
        scaleY: scale,
        left: canvasW / 2,
        top: canvasH / 2,
        originX: "center",
        originY: "center",
        selectable: true,
        evented: true,
      });

      c.add(group);
      c.setActiveObject(group);
      c.renderAll();

      // 5️⃣ Ungroup to individual objects
      group.toActiveSelection();
      const selection = c.getActiveObject();

      selection._objects.forEach((obj, i) => {
        // 🔤 FIX TEXT ALIGNMENT
        if (obj.type === "text" || obj.type === "i-text") {
          const bounds = obj.getBoundingRect(true, true);

          const textbox = new fabric.Textbox(obj.text, {
            left: bounds.left + bounds.width / 2,
            top: bounds.top + bounds.height / 2,
            originX: "center",
            originY: "center",
            width: bounds.width,
            fontSize: obj.fontSize || 16,
            fill: obj.fill || "#000",
            fontFamily: obj.fontFamily || "Arial",
            lineHeight: obj.lineHeight || 1.2,
            editable: true,
            selectable: true,
            evented: true,
            name: obj.id || `Text ${i + 1}`,
          });

          c.remove(obj);
          c.add(textbox);
        } else {
          obj.set({
            selectable: true,
            evented: true,
            name: obj.id || `${obj.type} ${i + 1}`,
          });
        }
      });

      c.discardActiveObject();

      // 6️⃣ Reset view (IMPORTANT)
      c.setZoom(1);
      c.viewportTransform = [1, 0, 0, 1, 0, 0];
      c.renderAll();

      // 7️⃣ Sync layers
      setLayers([...c.getObjects()].reverse());
    });
  };

  reader.readAsText(file);
};

  // ---------- CONTROLS ----------

  const deleteObject = (obj) => {
    if (!obj || !canvas.current) return;

    const c = canvas.current;

    // Remove safely even if locked
    c.remove(obj);

    // Clear active selection
    if (c.getActiveObject() === obj) {
      c.discardActiveObject();
    }

    c.requestRenderAll();
  };

  const addText = () => {
    const t = new fabric.Textbox("New Text", {
      left: 100,
      top: 100,
      fontSize: 32,
      fill: "#000",
      editable: true,
      name: "Text",
    });
    canvas.current.add(t);
    canvas.current.setActiveObject(t);
  };

  const updateColor = (c) => {
    if (!activeObj) return;
    activeObj.set("fill", c);
    canvas.current.renderAll();
  };
  const duplicateObj = () => {
    if (!activeObj || !canvas.current) return;

    activeObj.clone((cloned) => {
      cloned.set({
        left: activeObj.left + 20,
        top: activeObj.top + 20,
        name: `${activeObj.name || activeObj.type} copy`,
      });

      canvas.current.add(cloned);
      canvas.current.setActiveObject(cloned);
      canvas.current.renderAll();
      setLayers([...canvas.current.getObjects()].reverse());
    });
  };

  const toggleLock = (obj) => {
    if (!obj || !canvas.current) return;

    const locked = obj.isLocked === true;

    obj.set({
      isLocked: !locked,

      lockMovementX: !locked,
      lockMovementY: !locked,
      lockScalingX: !locked,
      lockScalingY: !locked,
      lockRotation: !locked,

      selectable: false, // unlock → true
      evented: false, // unlock → true
      hasControls: locked,
      hasBorders: locked,
      opacity: locked ? 1 : 0.6,
    });

    if (!locked) {
      canvas.current.discardActiveObject();
    }

    canvas.current.requestRenderAll();
  };

  const centerObject = () => {
    if (!activeObj || !canvas.current) return;

    activeObj.center();
    activeObj.setCoords();
    canvas.current.renderAll();
  };
  
  const snapToCenter = () => {
    if (!activeObj || !canvas.current) return;

    const c = canvas.current;

    activeObj.set({
      left: (c.getWidth() - activeObj.getScaledWidth()) / 2,
      top: (c.getHeight() - activeObj.getScaledHeight()) / 2,
    });

    activeObj.setCoords();
    c.renderAll();
  };

  // ---------- EXPORT ----------
  const exportPNG = () => {
    const url = canvas.current.toDataURL({ format: "png", quality: 1 });
    const a = document.createElement("a");
    a.href = url;
    a.download = "design.png";
    a.click();
  };

  return (
    <div className="h-screen bg-gray-900 text-white grid grid-cols-[260px_56px_1fr_300px] gap-3 p-3">
      {/* ---------- LAYERS PANEL ---------- */}
      <div className="bg-gray-950 rounded-lg shadow p-3 overflow-y-auto">
        <h2 className="font-semibold mb-3">📑 Layers</h2>

        {layers.map((obj, i) => (
          <div
            key={i}
            className={`flex items-center justify-between text-sm px-2 py-1 rounded cursor-pointer
      hover:bg-blue-100 ${activeObj === obj ? "bg-blue-200" : ""}`}
          >
            {/* ---- OBJECT NAME (SELECT) ---- */}
            <span
              className="flex-1 truncate"
              onClick={() => {
                setActiveObj(obj);
                focusObject(obj);
              }}
            >
              {obj.name || obj.type}
            </span>

            {/* ---- LOCK / UNLOCK ---- */}
            <span
              className="mx-1 cursor-pointer"
              title="Lock / Unlock"
              onClick={(e) => {
                e.stopPropagation();
                toggleLock(obj);
              }}
            >
              {obj.lockMovementX ? "🔒" : "🔓"}
            </span>

            {/* ---- VISIBILITY ---- */}
            <span
              className="mx-1 cursor-pointer"
              title="Show / Hide"
              onClick={(e) => {
                e.stopPropagation();
                obj.set("visible", !obj.visible);
                canvas.current.renderAll();
                setLayers([...canvas.current.getObjects()].reverse());
              }}
            >
              {obj.visible ? "👁" : "🚫"}
            </span>

            {/* ---- DELETE ---- */}
            <button onClick={() => deleteObject(obj)}>🗑</button>
          </div>
        ))}
      </div>
      {/* ---------- ICON TOOLBAR ---------- */}
      <div className="bg-gray-950 rounded-lg shadow flex flex-col items-center py-4 gap-4">
        <button onClick={addText} className="icon-btn" title="Text">
          ➕
        </button>

        <button onClick={duplicateObj} className="icon-btn" title="Duplicate">
          📑
        </button>

        <button onClick={snapToCenter} className="icon-btn" title="Center">
          🎯
        </button>

        <button onClick={groupObjects} className="icon-btn" title="Group">
          🧩
        </button>
        <button onClick={exportPNG} className="icon-btn" title="Export PNG">
          📥
        </button>
      </div>

      {/* ---------- CANVAS ---------- */}
      <div className="bg-gray-300 rounded-lg overflow-auto flex justify-center p-6">
        <div className="shadow-xl">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* ---------- CONTROL PANEL ---------- */}

      <div className="bg-gray-950 rounded-lg shadow p-4 space-y-4 overflow-y-auto">
        <h2 className="font-semibold text-center "> Controls</h2>

        <div>
          <label className="text-sm font-medium">📐 Page Size</label>

          <select
            className="w-full border rounded px-2 py-1 bg-gray-950"
            onChange={(e) => {
              const size = e.target.value;

              if (size === "A4") setPageSize({ width: 794, height: 1123 });

              if (size === "A3") setPageSize({ width: 1123, height: 1587 });

              if (size === "Square") setPageSize({ width: 800, height: 800 });
            }}
          >
            <option value="A4">A4 (Portrait)</option>
            <option value="A3">A3</option>
            <option value="Square">Square</option>
          </select>
        </div>
        <button
          onClick={resetView}
          className="toolbar-btn bg-gray-950 hover:bg-white hover:text-black w-full"
        >
          🔄 Reset View
        </button>

        {/* IMAGE UPLOAD */}
<input
  ref={imageInputRef}   // ✅ REQUIRED
  type="file"
  accept="image/*,.svg"
  className="w-full text-sm bg-gray-900 border border-gray-700 rounded px-2 py-1"
  onChange={(e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "image/svg+xml") {
      importSVG(file);
    } else {
      uploadImage(file);
    }

    e.target.value = "";
  }}
/>
<input
  type="file"
  accept=".json"
  onChange={(e) => {
    const file = e.target.files[0];
    if (file) importTextJSON(file);
    e.target.value = "";
  }}
/>



        {/* ---------- PROPERTIES PANEL ---------- */}
        <div className="bg-gray-950 text-white rounded-lg shadow p-4 space-y-4 overflow-y-auto">
          <h2 className="font-semibold text-white">🛠 Properties</h2>

          {!activeObj && (
            <p className="text-sm text-gray-400">
              Select a layer to edit properties
            </p>
          )}

          {activeObj && (
            <>
              {/* -------- NAME -------- */}
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-900 text-white border border-gray-700 rounded px-2 py-1
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activeObj.name || ""}
                  onChange={(e) => {
                    activeObj.set("name", e.target.value);
                    canvas.current.renderAll();
                    setLayers([...canvas.current.getObjects()].reverse());
                  }}
                />
              </div>

              {/* -------- FILL COLOR -------- */}
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Fill Color
                </label>
                <input
                  type="color"
                  className="w-full h-10 bg-gray-900 border border-gray-700 rounded cursor-pointer"
                  value={activeObj.fill || "#000000"}
                  onChange={(e) => {
                    activeObj.set("fill", e.target.value);
                    canvas.current.renderAll();
                  }}
                />
              </div>

              {/* -------- POSITION -------- */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-gray-300">X</label>
                  <input
                    type="number"
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded px-2 py-1"
                    value={Math.round(activeObj.left)}
                    onChange={(e) => {
                      activeObj.set("left", Number(e.target.value));
                      canvas.current.renderAll();
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">Y</label>
                  <input
                    type="number"
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded px-2 py-1"
                    value={Math.round(activeObj.top)}
                    onChange={(e) => {
                      activeObj.set("top", Number(e.target.value));
                      canvas.current.renderAll();
                    }}
                  />
                </div>
              </div>

              {/* -------- SIZE -------- */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Width
                  </label>
                  <input
                    type="number"
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded px-2 py-1"
                    value={Math.round(activeObj.width * activeObj.scaleX)}
                    onChange={(e) => {
                      activeObj.set(
                        "scaleX",
                        Number(e.target.value) / activeObj.width
                      );
                      canvas.current.renderAll();
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Height
                  </label>
                  <input
                    type="number"
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded px-2 py-1"
                    value={Math.round(activeObj.height * activeObj.scaleY)}
                    onChange={(e) => {
                      activeObj.set(
                        "scaleY",
                        Number(e.target.value) / activeObj.height
                      );
                      canvas.current.renderAll();
                    }}
                  />
                </div>
              </div>

              {/* -------- TEXT ONLY -------- */}
              {activeObj.type === "textbox" && (
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Font Size
                  </label>
                  <input
                    type="number"
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded px-2 py-1"
                    value={activeObj.fontSize}
                    onChange={(e) => {
                      activeObj.set("fontSize", Number(e.target.value));
                      canvas.current.renderAll();
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
