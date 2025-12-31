import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

export default function App() {
  const canvasRef = useRef(null);
  const canvas = useRef(null);

  const [svgTextMap, setSvgTextMap] = useState({});

  // 🔹 INIT CANVAS
  useEffect(() => {
    canvas.current = new fabric.Canvas(canvasRef.current, {
      width: 900,
      height: 500,
      backgroundColor: "#fff",
    });

    return () => canvas.current.dispose();
  }, []);

  // 🔹 UPLOAD SVG TEMPLATE
  const uploadSVG = (file) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    fabric.loadSVGFromString(e.target.result, (objects, options) => {
      const c = canvas.current;
      c.clear();

      const textMap = {};

      objects.forEach((obj) => {

        // 🔒 LOCK NON-TEXT (BACKGROUND)
        if (obj.type !== "text") {
          obj.set({
            selectable: false,
            evented: false,
          });
          c.add(obj);
          return;
        }

        // ✅ FIX TEXT ALIGNMENT
        const fixedText = new fabric.Textbox(obj.text || "", {
          left: obj.left + obj.width / 2,
          top: obj.top + obj.height / 2,
          width: obj.width || 300,
          fontSize: obj.fontSize || 24,
          fill: obj.fill || "#000",
          fontFamily: obj.fontFamily || "Arial",

          originX: "center",
          originY: "center",

          editable: true,
          selectable: true,
        });

        fixedText.svgId = obj.id; // keep SVG mapping
        textMap[obj.id] = fixedText;

        c.add(fixedText);
      });

      setSvgTextMap(textMap);
      c.renderAll();
    });
  };

  reader.readAsText(file);
};

  // 🔹 AUTO-MAP JSON → SVG TEXT
  const uploadJSON = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const json = JSON.parse(e.target.result);

      Object.keys(json).forEach((key) => {
        if (svgTextMap[key]) {
          svgTextMap[key].set("text", json[key]);
        }
      });

      canvas.current.renderAll();
    };
    reader.readAsText(file);
  };

  // 🔹 SAVE TEXT JSON
  const saveTextJSON = () => {
    const data = {};

    Object.keys(svgTextMap).forEach((key) => {
      data[key] = svgTextMap[key].text;
    });

    downloadFile(
      JSON.stringify(data, null, 2),
      "text-data.json",
      "application/json"
    );
  };

  // 🔹 EXPORT EDITABLE SVG
  const exportSVG = () => {
    const svg = canvas.current.toSVG();
    downloadFile(svg, "editable-design.svg", "image/svg+xml");
  };

  // 🔹 DOWNLOAD HELPER
  const downloadFile = (data, filename, type) => {
    const blob = new Blob([data], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>SVG Text Editor</h2>

      <input
        type="file"
        accept=".svg"
        onChange={(e) => uploadSVG(e.target.files[0])}
      />

      <input
        type="file"
        accept=".json"
        onChange={(e) => uploadJSON(e.target.files[0])}
        style={{ marginLeft: 10 }}
      />

      <button onClick={saveTextJSON} style={{ marginLeft: 10 }}>
        Save Text JSON
      </button>

      <button onClick={exportSVG} style={{ marginLeft: 10 }}>
        Export SVG
      </button>

      <br /><br />

      <canvas ref={canvasRef} />
    </div>
  );
}
