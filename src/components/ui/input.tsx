import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // `text-base` (16px) is load-bearing here, not a style choice: iOS magnifies
          // the whole page whenever a focused field computes below 16px, and inside the
          // Mini Program web-view nothing undoes that — there is no address bar and no
          // pinch-out — so the page just stays zoomed and clipped on both edges. At
          // text-sm the zoom was 16/14 = 1.14x; at 16px iOS does not zoom at all.
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
