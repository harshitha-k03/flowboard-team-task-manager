/// <reference types="vite/client" />

import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "spline-viewer": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        url: string;
        "events-target"?: string;
        loading?: string;
      };
    }
  }
}

export {};
