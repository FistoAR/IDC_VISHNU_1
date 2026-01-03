export const TEMPLATES = [
  {
    id: "poster-1",
    name: "Poster Template",
    width: 1080,
    height: 1350,
    objects: [
      {
        kind: "rect",
        props: { left: 0, top: 0, width: 1080, height: 1350, fill: "#ffffff", selectable: false, evented: false }
      },
      {
        kind: "rect",
        props: { left: 0, top: 0, width: 1080, height: 260, fill: "#111827", selectable: false, evented: false }
      },
      {
        kind: "text",
        props: {
          left: 60,
          top: 70,
          fontSize: 78,
          fontFamily: "Inter",
          fill: "#ffffff",
          fontWeight: "800",
          text: "BIG SALE",
        },
        meta: { role: "title", editable: true }
      },
      {
        kind: "text",
        props: {
          left: 60,
          top: 180,
          fontSize: 34,
          fontFamily: "Inter",
          fill: "#d1d5db",
          text: "Up to 50% off",
        },
        meta: { role: "subtitle", editable: true }
      },
      {
        kind: "imagePlaceholder",
        props: {
          left: 60,
          top: 340,
          width: 960,
          height: 720,
          fill: "#e5e7eb",
          rx: 28,
          ry: 28
        },
        meta: { role: "heroImage", editable: true }
      },
      {
        kind: "text",
        props: {
          left: 60,
          top: 1110,
          fontSize: 30,
          fontFamily: "Inter",
          fill: "#111827",
          text: "www.yoursite.com",
        },
        meta: { role: "footer", editable: true }
      },
    ],
  },

  {
    id: "ig-1",
    name: "Instagram Post",
    width: 1080,
    height: 1080,
    objects: [
      {
        kind: "rect",
        props: { left: 0, top: 0, width: 1080, height: 1080, fill: "#0ea5e9", selectable: false, evented: false }
      },
      {
        kind: "rect",
        props: { left: 80, top: 80, width: 920, height: 920, fill: "#ffffff", rx: 40, ry: 40 }
      },
      {
        kind: "text",
        props: {
          left: 140,
          top: 160,
          fontSize: 72,
          fontFamily: "Inter",
          fontWeight: "800",
          fill: "#0f172a",
          text: "NEW DROP",
        },
        meta: { role: "title", editable: true }
      },
      {
        kind: "text",
        props: {
          left: 140,
          top: 260,
          fontSize: 34,
          fontFamily: "Inter",
          fill: "#334155",
          text: "Fresh styles available today",
        },
        meta: { role: "subtitle", editable: true }
      },
      {
        kind: "imagePlaceholder",
        props: {
          left: 140,
          top: 350,
          width: 800,
          height: 520,
          fill: "#e2e8f0",
          rx: 30,
          ry: 30
        },
        meta: { role: "productImage", editable: true }
      },
      {
        kind: "text",
        props: {
          left: 140,
          top: 910,
          fontSize: 28,
          fontFamily: "Inter",
          fill: "#0f172a",
          text: "@yourbrand",
        },
        meta: { role: "handle", editable: true }
      },
    ],
  },
];