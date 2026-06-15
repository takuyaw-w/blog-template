import { parseHTML } from "linkedom";

const MERMAID_TEXT_WIDTH = 7.2;
const MERMAID_TEXT_HEIGHT = 18;
const BBOX_PADDING = 8;

let mermaidApi;
let renderCount = 0;
let domReady = false;

const parseNumber = (value, fallback = 0) => {
  const number = Number.parseFloat(value ?? "");

  return Number.isFinite(number) ? number : fallback;
};

const createBox = (x, y, width, height) => ({
  minX: x,
  minY: y,
  maxX: x + width,
  maxY: y + height,
});

const mergeBoxes = (boxes) => {
  const visibleBoxes = boxes.filter(Boolean);

  if (visibleBoxes.length === 0) {
    return undefined;
  }

  return {
    minX: Math.min(...visibleBoxes.map((box) => box.minX)),
    minY: Math.min(...visibleBoxes.map((box) => box.minY)),
    maxX: Math.max(...visibleBoxes.map((box) => box.maxX)),
    maxY: Math.max(...visibleBoxes.map((box) => box.maxY)),
  };
};

const translateBox = (box, x, y) =>
  box === undefined
    ? undefined
    : {
        minX: box.minX + x,
        minY: box.minY + y,
        maxX: box.maxX + x,
        maxY: box.maxY + y,
      };

const getTranslate = (element) => {
  const transform = element.getAttribute?.("transform") ?? "";
  const match = /translate\(\s*([-.\d]+)(?:[,\s]+([-.\d]+))?\s*\)/.exec(transform);

  if (!match) {
    return { x: 0, y: 0 };
  }

  return {
    x: parseNumber(match[1]),
    y: parseNumber(match[2]),
  };
};

const getPathBox = (element) => {
  const values = (element.getAttribute("d")?.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(
    Number,
  );
  const points = [];

  for (let index = 0; index < values.length - 1; index += 2) {
    points.push({ x: values[index], y: values[index + 1] });
  }

  return mergeBoxes(points.map((point) => createBox(point.x, point.y, 0, 0)));
};

const getPointsBox = (element) => {
  const values = (element.getAttribute("points")?.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(
    Number,
  );
  const points = [];

  for (let index = 0; index < values.length - 1; index += 2) {
    points.push({ x: values[index], y: values[index + 1] });
  }

  return mergeBoxes(points.map((point) => createBox(point.x, point.y, 0, 0)));
};

const getTextBox = (element) => {
  const text = element.textContent ?? "";
  const x = parseNumber(element.getAttribute("x"));
  const y = parseNumber(element.getAttribute("y"));
  const width = Math.max(16, text.length * MERMAID_TEXT_WIDTH);

  return createBox(x, y - MERMAID_TEXT_HEIGHT, width, MERMAID_TEXT_HEIGHT);
};

const getElementBox = (element) => {
  const tagName = String(element.tagName ?? "").toLowerCase();
  const childBoxes = Array.from(element.children ?? []).map((child) => {
    const box = getElementBox(child);
    const translate = getTranslate(child);

    return translateBox(box, translate.x, translate.y);
  });
  const childrenBox = mergeBoxes(childBoxes);
  let ownBox;

  if (tagName === "rect" || tagName === "image" || tagName === "foreignobject") {
    ownBox = createBox(
      parseNumber(element.getAttribute("x")),
      parseNumber(element.getAttribute("y")),
      parseNumber(element.getAttribute("width")),
      parseNumber(element.getAttribute("height")),
    );
  } else if (tagName === "circle") {
    const r = parseNumber(element.getAttribute("r"));
    const cx = parseNumber(element.getAttribute("cx"));
    const cy = parseNumber(element.getAttribute("cy"));

    ownBox = createBox(cx - r, cy - r, r * 2, r * 2);
  } else if (tagName === "ellipse") {
    const rx = parseNumber(element.getAttribute("rx"));
    const ry = parseNumber(element.getAttribute("ry"));
    const cx = parseNumber(element.getAttribute("cx"));
    const cy = parseNumber(element.getAttribute("cy"));

    ownBox = createBox(cx - rx, cy - ry, rx * 2, ry * 2);
  } else if (tagName === "line") {
    const x1 = parseNumber(element.getAttribute("x1"));
    const y1 = parseNumber(element.getAttribute("y1"));
    const x2 = parseNumber(element.getAttribute("x2"));
    const y2 = parseNumber(element.getAttribute("y2"));

    ownBox = createBox(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
  } else if (tagName === "path") {
    ownBox = getPathBox(element);
  } else if (tagName === "polygon" || tagName === "polyline") {
    ownBox = getPointsBox(element);
  } else if (tagName === "text" || tagName === "tspan") {
    ownBox = getTextBox(element);
  }

  return mergeBoxes([ownBox, childrenBox]);
};

const setupMermaidDom = () => {
  if (domReady) {
    return;
  }

  const { window } = parseHTML("<!doctype html><html><body></body></html>");

  globalThis.window = window;
  globalThis.document = window.document;
  Object.defineProperty(globalThis, "navigator", {
    value: window.navigator,
    configurable: true,
  });

  globalThis.Element = window.Element;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.SVGElement = window.SVGElement;
  globalThis.Node = window.Node;
  globalThis.CSSStyleSheet = class {
    cssRules = [];

    insertRule(rule, index = this.cssRules.length) {
      this.cssRules.splice(index, 0, { cssText: rule });
    }
  };

  window.SVGElement.prototype.getBBox = function getBBox() {
    const box = getElementBox(this);

    if (box === undefined) {
      return { x: 0, y: 0, width: 16, height: MERMAID_TEXT_HEIGHT };
    }

    return {
      x: box.minX,
      y: box.minY,
      width: Math.max(16, box.maxX - box.minX),
      height: Math.max(MERMAID_TEXT_HEIGHT, box.maxY - box.minY),
    };
  };

  window.SVGElement.prototype.getComputedTextLength = function getComputedTextLength() {
    return Math.max(16, (this.textContent ?? "").length * MERMAID_TEXT_WIDTH);
  };

  domReady = true;
};

const getMermaid = async () => {
  setupMermaidDom();
  mermaidApi ??= (await import("mermaid")).default;

  return mermaidApi;
};

const getMermaidConfig = () => ({
  startOnLoad: false,
  securityLevel: "strict",
  theme: "base",
  htmlLabels: false,
  flowchart: {
    htmlLabels: false,
  },
  themeVariables: {
    background: "#fdf6e3",
    mainBkg: "#fff4dd",
    primaryColor: "#fff4dd",
    primaryTextColor: "#073642",
    primaryBorderColor: "#d3cbb3",
    secondaryColor: "#eee8d5",
    secondaryTextColor: "#073642",
    tertiaryColor: "#fdf6e3",
    lineColor: "#586e75",
    textColor: "#073642",
    noteBkgColor: "#eee8d5",
    noteTextColor: "#073642",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", YuGothic, Meiryo, "Noto Sans JP", system-ui, sans-serif',
  },
});

const normalizeSvgBounds = (svg) => {
  const { document } = parseHTML(`<body>${svg}</body>`);
  const svgElement = document.querySelector("svg");

  if (svgElement === null) {
    return svg;
  }

  const box = getElementBox(svgElement);

  if (box === undefined) {
    return svg;
  }

  const minX = Math.floor(box.minX - BBOX_PADDING);
  const minY = Math.floor(box.minY - BBOX_PADDING);
  const width = Math.ceil(box.maxX - box.minX + BBOX_PADDING * 2);
  const height = Math.ceil(box.maxY - box.minY + BBOX_PADDING * 2);

  svgElement.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
  svgElement.setAttribute("style", `max-width: ${width}px;`);
  svgElement.setAttribute("width", "100%");
  svgElement.setAttribute("height", "auto");

  return svgElement.outerHTML;
};

const renderMermaidFigure = async (source) => {
  const mermaid = await getMermaid();
  const diagramId = `mermaid-diagram-${++renderCount}`;

  mermaid.initialize(getMermaidConfig());

  const { svg } = await mermaid.render(diagramId, source);

  return `<figure class="mermaid-figure not-prose"><div class="mermaid-diagram">${normalizeSvgBounds(svg)}</div></figure>`;
};

const walk = async (node, visitor, parent = undefined) => {
  await visitor(node, parent);

  if (!Array.isArray(node.children)) {
    return;
  }

  for (const child of node.children) {
    await walk(child, visitor, node);
  }
};

export const remarkMermaid = () => async (tree, file) => {
  const replacements = [];

  await walk(tree, async (node, parent) => {
    if (parent === undefined || node.type !== "code" || node.lang !== "mermaid") {
      return;
    }

    try {
      replacements.push({
        node,
        parent,
        html: await renderMermaidFigure(node.value),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      file.fail(`Mermaid diagram failed to render at build time: ${message}`, node);
    }
  });

  for (const replacement of replacements) {
    const index = replacement.parent.children.indexOf(replacement.node);

    if (index >= 0) {
      replacement.parent.children[index] = {
        type: "html",
        value: replacement.html,
      };
    }
  }
};
