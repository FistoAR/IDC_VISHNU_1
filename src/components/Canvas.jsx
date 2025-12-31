import { useEffect, useRef } from "react";
import { fabric } from "fabric/dist/fabric.js";

export default function CanvasEditor({ setCanvas, setActiveObj }) {
  const canvasEl = useRef(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasEl.current, {
      width: 794,      // A4 width
      height: 1123,    // A4 height
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });

    // expose canvas to parent
    setCanvas(canvas);

    // active object tracking
    canvas.on("selection:created", (e) => setActiveObj(e.selected[0]));
    canvas.on("selection:updated", (e) => setActiveObj(e.selected[0]));
    canvas.on("selection:cleared", () => setActiveObj(null));

    // test object (you SHOULD see this)
    canvas.add(
      new fabric.Textbox("Canvas Ready ✅", {
        left: 100,
        top: 100,
        fontSize: 30,
        fill: "#000",
      })
    );

    canvas.renderAll();

    return () => {
      canvas.dispose();
    };
  }, [setCanvas, setActiveObj]);

  return (
    <canvas
      ref={canvasEl}
      style={{
        border: "1px solid #ccc",
        boxShadow: "0 0 15px rgba(0,0,0,.25)",
        background: "#fff",
      }}
    />
  );
}
