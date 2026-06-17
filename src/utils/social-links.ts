export const SOCIAL_ICON_NAMES = {
  github: "brand-github",
  x: "brand-x",
} as const;

export const SOCIAL_LINKS = [
  {
    key: "x",
    href: "https://x.com/takuyaw_w_x",
    label: "Follow Takuya on X",
    icon: SOCIAL_ICON_NAMES.x,
  },
  {
    key: "github",
    href: "https://github.com/takuyaw-w",
    label: "Go to Takuya's GitHub profile",
    icon: SOCIAL_ICON_NAMES.github,
  },
] as const;
