import { useRef, useState } from "react";

export default function SvgTextEditor() {
  const fileInputRef = useRef(null);
  const svgContainerRef = useRef(null);

  const [originalSVG, setOriginalSVG] = useState("");
  const [fileName, setFileName] = useState("");

  // ---------- LOAD SVG ----------
  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalSVG(e.target.result);
      setFileName(file.name);
      renderSVG(e.target.result);
    };
    reader.readAsText(file);
  };

  // ---------- RENDER SVG ----------
  const renderSVG = (svgText) => {
    svgContainerRef.current.innerHTML = svgText;
    enableTextEditing();
  };

  // ---------- ENABLE TEXT EDIT ----------
  const enableTextEditing = () => {
    const svg = svgContainerRef.current.querySelector("svg");
    if (!svg) return;

    svg.querySelectorAll("text, tspan").forEach((el) => {
      if (!el.textContent.trim()) return;

      el.style.cursor = "pointer";

      el.onclick = (e) => {
        e.stopPropagation();
        startEditing(el);
      };
    });
  };

  // ---------- START EDIT ----------
  const startEditing = (el) => {
    const box = el.getBoundingClientRect();
    const container = svgContainerRef.current.getBoundingClientRect();

    const editor = document.createElement("div");
    editor.contentEditable = true;
    editor.textContent = el.textContent;

    editor.style.cssText = `
      position:absolute;
      left:${box.left - container.left}px;
      top:${box.top - container.top}px;
      font-size:${getComputedStyle(el).fontSize};
      font-family:${getComputedStyle(el).fontFamily};
      color:${el.getAttribute("fill") || "#000"};
      background:transparent;
      border:none;
      outline:none;
      white-space:pre;
      z-index:10;
    `;

    el.style.visibility = "hidden";
    svgContainerRef.current.appendChild(editor);
    editor.focus();

    editor.oninput = () => {
      el.textContent = editor.textContent;
    };

    editor.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        editor.remove();
        el.style.visibility = "visible";
      }
    };

    editor.onblur = () => {
      editor.remove();
      el.style.visibility = "visible";
    };
  };

  // ---------- DOWNLOAD SVG ----------
  const downloadSVG = () => {
    const svg = svgContainerRef.current.querySelector("svg");
    if (!svg) return;

    const clone = svg.cloneNode(true);

    clone.querySelectorAll("*").forEach((el) => {
      el.removeAttribute("style");
      el.onclick = null;
    });

    const blob = new Blob(
      [new XMLSerializer().serializeToString(clone)],
      { type: "image/svg+xml" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName.replace(".svg", "-edited.svg");
    a.click();
  };

  // ---------- RESET ----------
  const resetSVG = () => {
    if (originalSVG) renderSVG(originalSVG);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🎨 SVG Text Editor (Pure SVG)</h2>

      <input
        ref={fileInputRef}
        type="file"
        accept=".svg"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <div
        ref={svgContainerRef}
        style={{
          marginTop: 20,
          background: "#fff",
          padding: 20,
          minHeight: 400,
          position: "relative",
        }}
      />

      {fileName && (
        <div style={{ marginTop: 20 }}>
          <button onClick={downloadSVG}>⬇ Download SVG</button>
          <button onClick={resetSVG} style={{ marginLeft: 10 }}>
            🔄 Reset
          </button>
        </div>
      )}
    </div>
  );
}
