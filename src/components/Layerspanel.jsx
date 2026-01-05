import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

export default function Editor() {
  const canvasRef = useRef(null);
  const canvas = useRef(null);
  const [extractedText, setExtractedText] = useState([]);

  /* =========================
      INIT CANVAS
  ========================== */
  useEffect(() => {
    canvas.current = new fabric.Canvas(canvasRef.current, {
      width: 900,
      height: 500,
      backgroundColor: "#ffffff",
      selection: true
    });

    return () => canvas.current.dispose();
  }, []);

  /* =========================
      SVG UPLOAD (WITH TEXT)
  ========================== */
  const uploadSVG = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      fabric.loadSVGFromString(reader.result, (objects) => {
        objects.forEach((obj) => {
          // 🔹 SVG TEXT → FABRIC TEXTBOX
          if (obj.type === "text" || obj.type === "i-text") {
            const textBox = new fabric.Textbox(obj.text || "Text", {
              left: obj.left,
              top: obj.top,
              fontSize: obj.fontSize || 24,
              fill: obj.fill || "#000",
              fontFamily: obj.fontFamily || "Arial",
              editable: true
            });
            canvas.current.add(textBox);
          }
          // 🔹 SHAPES
          else {
            obj.selectable = true;
            canvas.current.add(obj);
          }
        });

        canvas.current.renderAll();
      });
    };

    reader.readAsText(file);
  };

  /* =========================
        ADD TEXT
  ========================== */
  const addText = () => {
    const text = new fabric.Textbox("Edit me", {
      left: 100,
      top: 100,
      fontSize: 30,
      fill: "#000",
      editable: true
    });
    canvas.current.add(text).setActiveObject(text);
  };

  /* =========================
      EXTRACT TEXT DATA
  ========================== */
  const extractTextData = () => {
    const texts = canvas.current
      .getObjects()
      .filter(
        (obj) => obj.type === "textbox" || obj.type === "text"
      );

    const textData = texts.map((t, index) => ({
      id: index + 1,
      text: t.text,
      left: Math.round(t.left),
      top: Math.round(t.top),
      width: Math.round(t.width),
      fontSize: t.fontSize,
      fontFamily: t.fontFamily,
      fill: t.fill,
      textAlign: t.textAlign || "left"
    }));

    setExtractedText(textData);
    console.log("EXTRACTED TEXT:", textData);
  };

  /* =========================
        SAVE JSON
  ========================== */
  const saveJSON = () => {
    const json = JSON.stringify(canvas.current.toJSON(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "editor.json";
    a.click();
  };

  /* =========================
        LOAD JSON
  ========================== */
  const loadJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      canvas.current.loadFromJSON(reader.result, () => {
        canvas.current.renderAll();
      });
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Fabric Text Editor</h2>

      <div style={{ marginBottom: 10 }}>
        <button onClick={addText}>Add Text</button>
        <input type="file" accept=".svg" onChange={uploadSVG} />
        <input type="file" accept=".json" onChange={loadJSON} />
        <button onClick={saveJSON}>Save JSON</button>
        <button onClick={extractTextData}>Extract Text</button>
      </div>

      <canvas ref={canvasRef} />

      {/* TEXT OUTPUT */}
      <div style={{ marginTop: 20 }}>
        <h3>Extracted Text Data</h3>
        <pre style={{ background: "#f3f4f6", padding: 10 }}>
          {JSON.stringify(extractedText, null, 2)}
        </pre>
      </div>
    </div>
  );
}
