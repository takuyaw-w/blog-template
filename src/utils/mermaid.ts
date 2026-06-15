type MermaidApi = typeof import("mermaid").default;

const diagramSelector = ".mermaid-figure[data-mermaid-source]";
const processedKey = "mermaidProcessed";
let mermaidApi: MermaidApi | undefined;
let renderCounter = 0;
let renderQueue = Promise.resolve();
let themeObserverStarted = false;

const loadMermaid = async () => {
  mermaidApi ??= (await import("mermaid")).default;

  return mermaidApi;
};

const getCssValue = (styles: CSSStyleDeclaration, property: string) =>
  styles.getPropertyValue(property).trim();

const getCssRgb = (styles: CSSStyleDeclaration, property: string) => {
  const value = getCssValue(styles, property);

  return value.includes(",") ? `rgb(${value})` : value;
};

const getMermaidConfig = () => {
  const styles = getComputedStyle(document.documentElement);
  const fontFamily = getCssValue(styles, "--font-sans");

  return {
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    themeVariables: {
      background: getCssRgb(styles, "--surface"),
      mainBkg: getCssRgb(styles, "--surface-strong"),
      primaryColor: getCssRgb(styles, "--surface-strong"),
      primaryTextColor: getCssRgb(styles, "--black"),
      primaryBorderColor: getCssRgb(styles, "--border"),
      secondaryColor: getCssRgb(styles, "--surface-soft"),
      secondaryTextColor: getCssRgb(styles, "--gray-dark"),
      tertiaryColor: getCssRgb(styles, "--surface"),
      lineColor: getCssRgb(styles, "--gray"),
      textColor: getCssRgb(styles, "--gray-dark"),
      noteBkgColor: getCssRgb(styles, "--surface-soft"),
      noteTextColor: getCssRgb(styles, "--black"),
      fontFamily,
    },
  } satisfies Parameters<MermaidApi["initialize"]>[0];
};

const getSourceFromBlock = (block: HTMLPreElement) => block.textContent?.trim() ?? "";

const isMermaidBlock = (block: HTMLPreElement) =>
  block.dataset.language === "mermaid" ||
  block.querySelector("code")?.classList.contains("language-mermaid") === true;

const getMermaidBlocks = () =>
  Array.from(document.querySelectorAll<HTMLPreElement>("pre")).filter(
    (block) => block.dataset[processedKey] !== "true" && isMermaidBlock(block),
  );

const createError = (message: string) => {
  const error = document.createElement("p");
  error.className = "mermaid-error";
  error.setAttribute("role", "alert");
  error.textContent = message;

  return error;
};

const renderDiagram = async (mermaid: MermaidApi, source: string) => {
  const id = `mermaid-diagram-${Date.now()}-${renderCounter++}`;
  const { svg, bindFunctions } = await mermaid.render(id, source);
  const diagram = document.createElement("div");

  diagram.className = "mermaid-diagram";
  diagram.innerHTML = svg;
  bindFunctions?.(diagram);

  return diagram;
};

const replaceBlockWithDiagram = async (mermaid: MermaidApi, block: HTMLPreElement) => {
  const source = getSourceFromBlock(block);

  if (!source) {
    block.dataset[processedKey] = "true";
    return;
  }

  try {
    const diagram = await renderDiagram(mermaid, source);
    const figure = document.createElement("figure");

    figure.className = "mermaid-figure not-prose";
    figure.dataset.mermaidSource = source;
    figure.append(diagram);
    block.replaceWith(figure);
  } catch (error) {
    block.dataset[processedKey] = "true";
    block.after(createError("Mermaid diagram failed to render."));
    console.error(error);
  }
};

const rerenderExistingDiagrams = async (mermaid: MermaidApi) => {
  const figures = Array.from(document.querySelectorAll<HTMLElement>(diagramSelector));

  await Promise.all(
    figures.map(async (figure) => {
      const source = figure.dataset.mermaidSource;

      if (!source) {
        return;
      }

      try {
        const diagram = await renderDiagram(mermaid, source);
        figure.replaceChildren(diagram);
      } catch (error) {
        figure.replaceChildren(createError("Mermaid diagram failed to render."));
        console.error(error);
      }
    }),
  );
};

const renderMermaidDiagrams = async () => {
  const blocks = getMermaidBlocks();
  const hasExistingDiagrams = document.querySelector(diagramSelector) !== null;

  if (blocks.length === 0 && !hasExistingDiagrams) {
    return;
  }

  const mermaid = await loadMermaid();

  mermaid.initialize(getMermaidConfig());

  if (blocks.length > 0) {
    for (const block of blocks) {
      await replaceBlockWithDiagram(mermaid, block);
    }
  } else {
    await rerenderExistingDiagrams(mermaid);
  }
};

const queueRender = () => {
  renderQueue = renderQueue.then(renderMermaidDiagrams, renderMermaidDiagrams);
};

const startThemeObserver = () => {
  if (themeObserverStarted) {
    return;
  }

  themeObserverStarted = true;
  let currentTheme = document.documentElement.dataset.theme ?? "";

  new MutationObserver(() => {
    const nextTheme = document.documentElement.dataset.theme ?? "";

    if (nextTheme === currentTheme || document.querySelector(diagramSelector) === null) {
      currentTheme = nextTheme;
      return;
    }

    currentTheme = nextTheme;
    queueRender();
  }).observe(document.documentElement, {
    attributeFilter: ["data-theme"],
    attributes: true,
  });
};

export const initMermaidDiagrams = () => {
  startThemeObserver();
  queueRender();
};
