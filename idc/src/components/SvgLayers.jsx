import { useEffect, useRef } from "react";
import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";

export default function SvgLayer({ width, height }) {
  const ref = useRef(null);
  const draw = useRef(null);

  useEffect(() => {
    draw.current = SVG()
      .addTo(ref.current)
      .size(width, height);

    // expose globally
    window.__SVG_DRAW__ = draw.current;

    return () => draw.current.clear();
  }, [width, height]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "auto",
      }}
    />
  );
}
