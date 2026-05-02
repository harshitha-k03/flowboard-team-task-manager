import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide", {
  variants: {
    variant: {
      default: "border-primary/10 bg-primary/10 text-primary",
      secondary: "border-border bg-secondary text-secondary-foreground",
      outline: "border-border bg-card text-foreground",
      destructive: "border-red-200 bg-red-50 text-red-700"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
