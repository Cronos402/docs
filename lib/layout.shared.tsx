import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { ThemeLogo } from '@/components/theme-logo';

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <ThemeLogo />,
    },
    // see https://fumadocs.dev/docs/ui/navigation/links
    links: [
      {
      type: "icon",
      icon: "github",
      text: "GitHub",
      url: "https://github.com/cronos402/cronos402",
    },
      {
      type: "icon",
      icon: "x",
      text: "X",
      url: "https://x.com/cronos402",
    },
      {
      type: "icon",
      icon: "telegram",
      text: "TG",
      url: "https://t.me/cronos402",
    },
  ],
  };
}
