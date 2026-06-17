import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori, { type Font } from "satori";
import { SITE_TITLE } from "../consts";

const WIDTH = 1200;
const HEIGHT = 630;
const FONT_FAMILY = "Noto Sans JP";
const fontDirectory = join(process.cwd(), "src", "og", "fonts");
const fontsourceDirectory = join(
  process.cwd(),
  "node_modules",
  "@fontsource",
  "noto-sans-jp",
  "files",
);

type OgImageInput = {
  title: string;
  description?: string;
  tags?: string[];
  kind?: "blog" | "project";
  meta?: string;
};

const kindStyles = {
  blog: {
    label: "Blog",
    accent: "#2aa198",
    wash: "rgba(42, 161, 152, 0.1)",
  },
  project: {
    label: "Project",
    accent: "#268bd2",
    wash: "rgba(38, 139, 210, 0.1)",
  },
} as const;

const truncateText = (text: string | undefined, maxLength: number) => {
  if (!text) {
    return "";
  }

  const chars = Array.from(text.trim().replace(/\s+/g, " "));
  return chars.length > maxLength ? `${chars.slice(0, maxLength - 1).join("")}…` : chars.join("");
};

const readFirstExistingFile = async (paths: string[]) => {
  for (const path of paths) {
    try {
      return await readFile(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  return undefined;
};

const findLocalFont = async (weight: 400 | 700) => {
  const entries = await readdir(fontDirectory).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  });
  const fontFiles = entries.filter((entry) => /\.(?:woff|ttf|otf)$/i.test(entry));
  const preferredPatterns =
    weight === 700 ? [/bold/i, /700/, /medium/i, /semibold/i] : [/regular/i, /400/, /normal/i];
  const preferredFile =
    fontFiles.find((file) => preferredPatterns.some((pattern) => pattern.test(file))) ??
    fontFiles[0];

  return preferredFile ? readFile(join(fontDirectory, preferredFile)) : undefined;
};

const loadFontsourceFont = async (weight: 400 | 700) => {
  const fontPaths =
    weight === 700
      ? [
          join(fontsourceDirectory, "noto-sans-jp-japanese-700-normal.woff"),
          join(fontsourceDirectory, "noto-sans-jp-latin-700-normal.woff"),
        ]
      : [
          join(fontsourceDirectory, "noto-sans-jp-japanese-400-normal.woff"),
          join(fontsourceDirectory, "noto-sans-jp-latin-400-normal.woff"),
        ];

  return readFirstExistingFile(fontPaths);
};

const loadFontData = async (weight: 400 | 700) => {
  const data = (await findLocalFont(weight)) ?? (await loadFontsourceFont(weight));

  if (!data) {
    throw new Error(
      `Missing OGP font for weight ${weight}. Place a Japanese-capable .woff, .ttf, or .otf file in ${fontDirectory}, or install @fontsource/noto-sans-jp.`,
    );
  }

  return data;
};

let fontCache: Promise<Font[]> | undefined;

const loadFonts = () => {
  fontCache ??= Promise.all([
    loadFontData(400).then((data) => ({
      name: FONT_FAMILY,
      data,
      weight: 400 as const,
      style: "normal" as const,
    })),
    loadFontData(700).then((data) => ({
      name: FONT_FAMILY,
      data,
      weight: 700 as const,
      style: "normal" as const,
    })),
  ]);

  return fontCache;
};

const createTagNode = (tag: string, accent = "#268bd2") => ({
  type: "div",
  props: {
    style: {
      border: `2px solid ${accent}`,
      borderRadius: 999,
      padding: "10px 18px",
      color: "#073642",
      fontSize: 26,
      fontWeight: 700,
      lineHeight: 1,
    },
    children: truncateText(tag, 18),
  },
});

const createOgNode = ({ title, description, tags = [], kind = "blog", meta }: OgImageInput) => {
  const style = kindStyles[kind];

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: WIDTH,
        height: HEIGHT,
        padding: 64,
        background: `linear-gradient(135deg, ${style.wash}, transparent 38%), #fdf6e3`,
        color: "#073642",
        fontFamily: FONT_FAMILY,
        position: "relative",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: 18,
              height: HEIGHT,
              background: style.accent,
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 32,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    color: "#586e75",
                    fontSize: 30,
                    fontWeight: 700,
                    letterSpacing: 0,
                  },
                  children: SITE_TITLE,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    border: `2px solid ${style.accent}`,
                    borderRadius: 999,
                    padding: "10px 20px",
                    color: "#073642",
                    fontSize: 27,
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: 0,
                  },
                  children: style.label,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 24,
              maxWidth: 980,
            },
            children: [
              meta
                ? {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        color: style.accent,
                        fontSize: 28,
                        fontWeight: 700,
                        letterSpacing: 0,
                      },
                      children: truncateText(meta, 48),
                    },
                  }
                : null,
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    color: "#073642",
                    fontSize: 64,
                    fontWeight: 700,
                    lineHeight: 1.14,
                    letterSpacing: 0,
                  },
                  children: truncateText(title, 54),
                },
              },
              description
                ? {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        color: "#586e75",
                        fontSize: 31,
                        fontWeight: 400,
                        lineHeight: 1.45,
                        letterSpacing: 0,
                      },
                      children: truncateText(description, 92),
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    gap: 14,
                    flexWrap: "wrap",
                  },
                  children: tags.slice(0, 3).map((tag) => createTagNode(tag, style.accent)),
                },
              },
            ],
          },
        },
      ],
    },
  };
};

export const renderOgImage = async (input: OgImageInput) => {
  const svg = await satori(createOgNode(input), {
    width: WIDTH,
    height: HEIGHT,
    fonts: await loadFonts(),
    embedFont: true,
  });

  return new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: WIDTH,
    },
  })
    .render()
    .asPng();
};
