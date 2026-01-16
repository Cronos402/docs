"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by showing nothing until mounted
  if (!mounted) {
    return (
      <div style={{ width: 120, height: 32 }} />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Image
      src={isDark ? "/Cronos402-logo-light.svg" : "/Cronos402-logo-dark.svg"}
      alt="Cronos402"
      width={120}
      height={32}
      priority
    />
  );
}
