import { useEffect, useMemo, useRef, useState } from "react";
import { fabric } from "fabric";
import { readPsd } from "ag-psd";
import {
  Eye,
  EyeOff,
  Trash2,
  Type,
  Image as ImageIcon,
  File as FileIcon,
  Save,
  FolderOpen,
  Layers,
  Ungroup,
  Download,
  ZoomIn,
  ZoomOut,
  Move,
} from "lucide-react";



export default function App() {
  const canvasElRef = useRef(null);
  const wrapRef = useRef(null);

  const [canvas, setCanvas] = useState(null);
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Text toolbar state
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState(48);
  const [fill, setFill] = useState("#ffffff");
  const [isBold, setIsBold] = useState(false);

  // Pan mode
  const [panMode, setPanMode] = useState(false);

  const fonts = ["Inter", "Roboto", "Poppins", "Arial", "Times New Roman"];

  const makeId = useMemo(() => {
    let n = 0;
    return () => `${Date.now()}-${(n += 1)}-${Math.random().toString(36).slice(2, 8)}`;
  }, []);

  // ---------- init fabric ----------
  useEffect(() => {
    const c = new fabric.Canvas(canvasElRef.current, {
      backgroundColor: "#2b2f36",
      preserveObjectStacking: true,
      selection: true,
    });

    // better text feel
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerStyle = "circle";
    fabric.Object.prototype.cornerColor = "#60a5fa";
    fabric.Object.prototype.borderColor = "#60a5fa";

    const syncLayers = () => setLayers(c.getObjects().slice().reverse());

    c.on("object:added", (e) => {
      const obj = e.target;
      if (!obj) return;
      if (!obj.id) obj.id = makeId();
      if (!obj.name) obj.name = obj.type || "Object";
    });

    c.on("selection:created", () => {
      const obj = c.getActiveObject();
      setSelectedId(obj?.id ?? null);
      syncTextToolbarFromObject(obj);
    });
    c.on("selection:updated", () => {
      const obj = c.getActiveObject();
      setSelectedId(obj?.id ?? null);
      syncTextToolbarFromObject(obj);
    });
    c.on("selection:cleared", () => {
      setSelectedId(null);
    });

    c.on("object:added", syncLayers);
    c.on("object:removed", syncLayers);
    c.on("object:modified", syncLayers);

    // --- Zoom with mouse wheel ---
    c.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      let zoom = c.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.max(0.2, Math.min(3, zoom));
      const p = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
      c.zoomToPoint(p, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // --- Pan (when panMode enabled) ---
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    c.on("mouse:down", (opt) => {
      if (!panMode) return;
      isDragging = true;
      c.selection = false;
      lastX = opt.e.clientX;
      lastY = opt.e.clientY;
    });

    c.on("mouse:move", (opt) => {
      if (!panMode || !isDragging) return;
      const e = opt.e;
      const vpt = c.viewportTransform;
      vpt[4] += e.clientX - lastX;
      vpt[5] += e.clientY - lastY;
      c.requestRenderAll();
      lastX = e.clientX;
      lastY = e.clientY;
    });

    c.on("mouse:up", () => {
      if (!panMode) return;
      isDragging = false;
      c.selection = true;
    });

    // Add an artboard rectangle (Canva-like)
    const artboard = new fabric.Rect({
      left: 200,
      top: 80,
      width: 800,
      height: 520,
      fill: "#ffffff",
      selectable: false,
      evented: false,
      hoverCursor: "default",
    });
    artboard.id = makeId();
    artboard.name = "Artboard";
    c.add(artboard);
    c.sendToBack(artboard);

    setCanvas(c);
    syncLayers();

    return () => c.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep pan mode in fabric handlers
  useEffect(() => {
    if (!canvas) return;
    canvas.defaultCursor = panMode ? "grab" : "default";
  }, [canvas, panMode]);

  // ---------- helpers ----------
  const getObjectById = (id) => canvas?.getObjects().find((o) => o.id === id);

  const layerLabel = (o) => {
    if (!o) return "Layer";
    if (o.selectable === false && o.evented === false) return o.name || "Artboard";
    if (o.type === "i-text") return (o.text || "Text").toString().slice(0, 24);
    if (o.type === "group") return o.name || "SVG Group";
    if (o.type === "image") return o.name || "Image";
    return o.name || o.type || "Object";
  };

  const fitToArtboard = (obj) => {
    if (!canvas || !obj) return;

    // find artboard (first non-selectable rect we created)
    const artboard = canvas
      .getObjects()
      .find((o) => o.type === "rect" && o.selectable === false && o.evented === false);
    if (!artboard) return;

    const maxW = artboard.width * 0.9;
    const maxH = artboard.height * 0.9;
    const w = obj.getScaledWidth();
    const h = obj.getScaledHeight();
    if (w <= maxW && h <= maxH) return;

    const scale = Math.min(maxW / w, maxH / h);
    obj.scale((obj.scaleX || 1) * scale);
  };

  const centerOnArtboard = (obj) => {
    if (!canvas || !obj) return;
    const artboard = canvas
      .getObjects()
      .find((o) => o.type === "rect" && o.selectable === false && o.evented === false);
    if (!artboard) return;

    obj.set({
      left: artboard.left + artboard.width / 2 - obj.getScaledWidth() / 2,
      top: artboard.top + artboard.height / 2 - obj.getScaledHeight() / 2,
    });
    obj.setCoords();
  };

  const syncTextToolbarFromObject = (obj) => {
    if (!obj || obj.type !== "i-text") return;
    setFontFamily(obj.fontFamily || "Inter");
    setFontSize(Number(obj.fontSize || 48));
    setFill(obj.fill || "#ffffff");
    setIsBold((obj.fontWeight || "normal") === "bold" || Number(obj.fontWeight) >= 600);
  };

  const applyTextProps = (patch) => {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== "i-text") return;

    obj.set(patch);
    obj.setCoords();
    canvas.requestRenderAll();
    setLayers(canvas.getObjects().slice().reverse());
  };

  // ---------- add text (reliable) ----------
  const addText = () => {
    if (!canvas) return;
    const t = new fabric.IText("Edit me", {
      left: 260,
      top: 160,
      fontFamily,
      fontSize,
      fill,
      fontWeight: isBold ? "bold" : "normal",
      editable: true,
    });
    t.id = makeId();
    t.name = "Text";
    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.requestRenderAll();
    setSelectedId(t.id);
  };

  // ---------- import image ----------
  const importImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      fabric.Image.fromURL(
        f.target.result,
        (img) => {
          img.id = makeId();
          img.name = file.name || "Image";
          fitToArtboard(img);
          centerOnArtboard(img);
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.requestRenderAll();
        },
        { crossOrigin: "anonymous" }
      );
    };
    reader.readAsDataURL(file);
  };

  // ---------- import SVG grouped ----------
  const importSvg = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const svgString = f.target.result;

      const normalizeSvgText = (objects) => {
  objects.forEach((obj) => {
    if (obj.type === "text" || obj.type === "i-text" || obj.type === "textbox") {
      // Fix anchor & baseline issues
      obj.set({
        originX: "center",
        originY: "center",
        textAlign: "center",
      });

      // Remove SVG transform side effects
      const cx = obj.left + obj.width / 2;
      const cy = obj.top + obj.height / 2;

      obj.set({
        left: cx,
        top: cy,
      });

      obj.setCoords();
    }
  });
};


      fabric.loadSVGFromString(svgString, (objects, options) => {
  if (!objects?.length) return;

  // 🔥 FIX TEXT ALIGNMENT
  normalizeSvgText(objects);

  const group = fabric.util.groupSVGElements(objects, options);

  group.set({
    originX: "center",
    originY: "center",
  });

  group.id = makeId();
  group.name = file.name || "SVG Group";

  fitToArtboard(group);
  centerOnArtboard(group);

  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
});
    };
    reader.readAsText(file);
  }
  // ---------- import PSD ----------
  const importPsd = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canvas) return;

    const buf = await file.arrayBuffer();
    let psd;
    try {
      psd = readPsd(buf, { skipCompositeImageData: true });
    } catch (err) {
      console.error(err);
      alert("PSD import failed. Try re-saving PSD or simplify it.");
      return;
    }

    const addNode = (node, parentOffset = { x: 0, y: 0 }) => {
      const offX = parentOffset.x + (node.left || 0);
      const offY = parentOffset.y + (node.top || 0);

      if (node.children?.length) {
        node.children.forEach((child) => addNode(child, { x: offX, y: offY }));
        return;
      }

      if (node.canvas) {
        const img = new fabric.Image(node.canvas, {
          left: offX,
          top: offY,
          opacity: node.opacity != null ? node.opacity : 1,
          visible: !node.hidden,
        });
        img.id = makeId();
        img.name = node.name || "PSD Layer";
        canvas.add(img);
      }
    };

    psd.children?.slice().reverse().forEach((child) => addNode(child));
    canvas.requestRenderAll();
    setLayers(canvas.getObjects().slice().reverse());
  };

  // ---------- layers controls ----------
  const selectLayer = (id) => {
    if (!canvas) return;
    const obj = getObjectById(id);
    if (!obj || obj.selectable === false) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    setSelectedId(id);
    syncTextToolbarFromObject(obj);
  };

  const toggleVisibility = (id) => {
    if (!canvas) return;
    const obj = getObjectById(id);
    if (!obj || obj.selectable === false) return;
    obj.visible = !obj.visible;
    canvas.requestRenderAll();
    setLayers(canvas.getObjects().slice().reverse());
  };

  const deleteLayer = (id) => {
    if (!canvas) return;
    const obj = getObjectById(id);
    if (!obj || obj.selectable === false) return;
    canvas.remove(obj);
    canvas.requestRenderAll();
    setLayers(canvas.getObjects().slice().reverse());
    if (selectedId === id) setSelectedId(null);
  };

  // ---------- project save/load ----------
  const saveProject = () => {
    if (!canvas) return;
    const json = canvas.toJSON(["id", "name", "selectable", "evented"]);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design.project.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadProject = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      try {
        const json = JSON.parse(f.target.result);
        canvas.clear();
        canvas.backgroundColor = "#2b2f36";

        canvas.loadFromJSON(json, () => {
          canvas.getObjects().forEach((obj, idx) => {
            if (!obj.id) obj.id = makeId();
            if (!obj.name) obj.name = `Layer ${idx + 1}`;
          });
          canvas.requestRenderAll();
          setLayers(canvas.getObjects().slice().reverse());
          setSelectedId(null);
        });
      } catch (err) {
        console.error(err);
        alert("Invalid project file.");
      }
    };
    reader.readAsText(file);
  };

  // ---------- export ----------
  const exportPng = () => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2, // higher resolution
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "export.png";
    a.click();
  };

  const exportSvg = () => {
    if (!canvas) return;
    const svg = canvas.toSVG();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- zoom buttons ----------
  const zoomBy = (factor) => {
    if (!canvas) return;
    const center = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    let zoom = canvas.getZoom() * factor;
    zoom = Math.max(0.2, Math.min(3, zoom));
    canvas.zoomToPoint(center, zoom);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Left toolbar */}
      <div className="w-16 bg-gray-800 flex flex-col gap-2 p-3 border-r border-gray-700">
        <button
          onClick={addText}
          className="p-3 bg-gray-700 hover:bg-gray-600 rounded flex justify-center transition"
          title="Add Text"
        >
          <Type size={22} />
        </button>

        <label className="cursor-pointer" title="Import Image">
          <div className="p-3 bg-gray-700 hover:bg-gray-600 rounded flex justify-center transition">
            <ImageIcon size={22} />
          </div>
          <input type="file" accept="image/*" onChange={importImage} className="hidden" />
        </label>

        <label className="cursor-pointer" title="Import SVG (keeps alignment)">
          <div className="p-3 bg-gray-700 hover:bg-gray-600 rounded flex justify-center transition">
            <FileIcon size={22} />
          </div>
          <input type="file" accept=".svg,image/svg+xml" onChange={importSvg} className="hidden" />
        </label>

        <label className="cursor-pointer" title="Import PSD (layers as images)">
          <div className="p-3 bg-gray-700 hover:bg-gray-600 rounded flex justify-center transition">
            <Layers size={22} />
          </div>
          <input type="file" accept=".psd" onChange={importPsd} className="hidden" />
        </label>

        <button
          onClick={() => setPanMode((v) => !v)}
          className={`p-3 rounded flex justify-center transition ${
            panMode ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-700 hover:bg-gray-600"
          }`}
          title="Pan mode"
        >
          <Move size={22} />
        </button>

        <button
          onClick={() => zoomBy(1.15)}
          className="p-3 bg-gray-700 hover:bg-gray-600 rounded flex justify-center transition"
          title="Zoom In"
        >
          <ZoomIn size={22} />
        </button>

        <button
          onClick={() => zoomBy(0.87)}
          className="p-3 bg-gray-700 hover:bg-gray-600 rounded flex justify-center transition"
          title="Zoom Out"
        >
          <ZoomOut size={22} />
        </button>
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-gray-800 flex items-center px-4 justify-between border-b border-gray-700">
          <div className="font-semibold">Canva-like Editor Foundation</div>

          <div className="flex items-center gap-2">
            <button
              onClick={saveProject}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm flex items-center gap-2"
              title="Save Project JSON"
            >
              <Save size={16} /> Save
            </button>

            <label className="cursor-pointer">
              <div
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm flex items-center gap-2"
                title="Open Project JSON"
              >
                <FolderOpen size={16} /> Open
              </div>
              <input type="file" accept=".json" onChange={loadProject} className="hidden" />
            </label>

            <button
              onClick={exportPng}
              className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm flex items-center gap-2"
              title="Export PNG"
            >
              <Download size={16} /> PNG
            </button>

            <button
              onClick={exportSvg}
              className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm flex items-center gap-2"
              title="Export SVG"
            >
              <Download size={16} /> SVG
            </button>
          </div>
        </div>

        {/* Text toolbar */}
        <div className="bg-gray-850 bg-gray-800/70 border-b border-gray-700 px-4 py-2 flex flex-wrap items-center gap-3">
          <div className="text-xs text-gray-300">
            Text tools work when a Text layer is selected.
          </div>

          <select
            value={fontFamily}
            onChange={(e) => {
              const v = e.target.value;
              setFontFamily(v);
              applyTextProps({ fontFamily: v });
            }}
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
          >
            {fonts.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={8}
            max={300}
            value={fontSize}
            onChange={(e) => {
              const v = Number(e.target.value || 48);
              setFontSize(v);
              applyTextProps({ fontSize: v });
            }}
            className="w-24 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
          />

          <input
            type="color"
            value={fill}
            onChange={(e) => {
              const v = e.target.value;
              setFill(v);
              applyTextProps({ fill: v });
            }}
            className="h-9 w-12 bg-transparent"
            title="Text color"
          />

          <button
            onClick={() => {
              const next = !isBold;
              setIsBold(next);
              applyTextProps({ fontWeight: next ? "bold" : "normal" });
            }}
            className={`px-3 py-1 rounded text-sm border transition ${
              isBold ? "bg-blue-600 border-blue-500" : "bg-gray-900 border-gray-700 hover:bg-gray-700"
            }`}
          >
            Bold
          </button>
        </div>

        <div ref={wrapRef} className="flex-1 flex justify-center items-center bg-gray-950 p-4 overflow-auto">
          <canvas
            ref={canvasElRef}
            width={1200}
            height={800}
            className="border-4 border-gray-800 shadow-2xl"
          />
        </div>

        <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-800">
          Tip: SVG text may not be editable. Use the Text tool to add/edit text reliably.
        </div>
      </div>

      {/* Right layers */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
        <div className="text-lg font-semibold mb-3">Layers ({layers.length})</div>

        <div className="space-y-1">
          {layers.map((layer) => {
            const isArtboard = layer.selectable === false && layer.evented === false;
            return (
              <div
                key={layer.id}
                onClick={() => selectLayer(layer.id)}
                className={`flex items-center gap-2 p-3 rounded transition text-sm ${
                  selectedId === layer.id ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                } ${isArtboard ? "opacity-80 cursor-default" : "cursor-pointer"}`}
              >
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    toggleVisibility(layer.id);
                  }}
                  disabled={isArtboard}
                  className="flex-shrink-0 disabled:opacity-50"
                  title="Toggle visibility"
                >
                  {layer.visible ? <Eye size={18} /> : <EyeOff size={18} className="text-gray-300" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{layerLabel(layer)}</div>
                  <div className="text-xs text-gray-300/70 truncate">{layer.type}</div>
                </div>

                {layer.type === "group" && !isArtboard && (
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      ungroup(layer.id);
                    }}
                    className="px-2 py-1 rounded bg-blue-500 hover:bg-blue-400 text-xs font-semibold flex items-center gap-1"
                    title="Ungroup SVG"
                  >
                    <Ungroup size={14} /> Ungroup
                  </button>
                )}

                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  disabled={isArtboard}
                  className="text-red-300 hover:text-red-200 flex-shrink-0 disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-gray-400 leading-5">
          <div className="font-semibold mb-1"></div>
          <div>
 
          </div>
        </div>
      </div>
    </div>
  );
}