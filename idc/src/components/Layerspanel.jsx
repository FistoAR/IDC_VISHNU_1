import { useState } from "react";
import { fabric } from "fabric/dist/fabric.js";

import CanvasEditor from "../components/CanvasEditor";
import ToolsPanel from "../components/ToolsPanel";

import img1 from "../assets/templete.svg";

export default function EditorPage() {
  const [canvas, setCanvas] = useState(null);
  const [activeObj, setActiveObj] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const TEMPLATE_LIST = [
    {
      id: "t1",
      name: "Template 1",
      preview: img1,
      path: "/templates/template.svg", // public/templates/template.svg
    },
  ];

  const loadTemplate = async (tpl) => {
    if (!canvas) return;

    setSelectedTemplate(tpl.id);

    const res = await fetch(tpl.path);
    const svgText = await res.text();

    fabric.loadSVGFromString(svgText, (objects, options) => {
      canvas.clear();

      objects.forEach((obj) => {
        obj.set({
          selectable: true,
          evented: true,
        });

        if (obj.type === "text" || obj.type === "textbox") {
          obj.editable = true;
        }

        canvas.add(obj);
      });

      // SCALE TO FIT PAGE
      const selection = new fabric.ActiveSelection(
        canvas.getObjects(),
        { canvas }
      );

      const bounds = selection.getBoundingRect();
      const scale = Math.min(
        canvas.width / bounds.width,
        canvas.height / bounds.height
      ) * 0.95;

      selection.scale(scale);
      selection.center();
      selection.setCoords();

      canvas.discardActiveObject();
      canvas.renderAll();
    });
  };

  const addText = (label) => {
    if (!canvas) return;

    const text = new fabric.Textbox(label, {
      left: 100,
      top: 100,
      fontSize: 32,
      fill: "#000",
      editable: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const exportImage = (format) => {
    if (!canvas) return;

    const data = canvas.toDataURL({ format, quality: 1 });
    const a = document.createElement("a");
    a.href = data;
    a.download = `design.${format}`;
    a.click();
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "15% 60% 25%",
        height: "100vh",
        gap: 10,
        padding: 10,
        background: "#42454d",
      }}
    >
      {/* LEFT */}
      <div style={{ background: "#fff", borderRadius: 10, padding: 12 }}>
        <h3>Templates</h3>

        {TEMPLATE_LIST.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => loadTemplate(tpl)}
            style={{
              cursor: "pointer",
              marginBottom: 12,
              border:
                selectedTemplate === tpl.id
                  ? "2px solid #3b82f6"
                  : "1px solid #ccc",
              borderRadius: 8,
              padding: 6,
            }}
          >
            <img src={tpl.preview} style={{ width: "100%" }} />
            <div style={{ textAlign: "center" }}>{tpl.name}</div>
          </div>
        ))}
      </div>

      {/* CENTER */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CanvasEditor
          setCanvas={setCanvas}
          setActiveObj={setActiveObj}
        />
      </div>

      {/* RIGHT */}
      <div style={{ background: "#fff", borderRadius: 10, padding: 12 }}>
        <h3>Tools</h3>
        <ToolsPanel canvas={canvas} />

        <h3>Text</h3>
        <button onClick={() => addText("Title Text")}>Add Title</button>
        <button onClick={() => addText("Body Text")}>Add Body</button>

        <h3>Export</h3>
        <button onClick={() => exportImage("png")}>Export PNG</button>
        <button onClick={() => exportImage("jpeg")}>Export JPG</button>
      </div>
    </div>
  );
}
