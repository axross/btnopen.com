# React Client Components

## `"use client"` Directive

- MUST place `"use client";` at the very top of the file, before any imports.

Example:

```tsx
"use client";

import { type ComponentProps, type JSX, useCallback } from "react";
import { trackAction } from "@/helpers/analytics";

export function SocialLinkList({
  className,
  ...props
}: ComponentProps<"div">): JSX.Element {
  const onGitHubLinkClick = useCallback(
    () => trackAction("github link click"),
    [],
  );

  return (
    <div className={...} {...props}>
      {/* ... */}
    </div>
  );
}
```

## Side-Effect-Only Components

- Side-effect-only Client Components (e.g., analytics page-view trackers) SHOULD return `null` and declare their return type as `null`.

Example:

```tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "@/helpers/analytics";

export function PageViewTracking(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackPageView({ pathname, searchParams });
  }, [pathname, searchParams]);

  return null;
}
```
