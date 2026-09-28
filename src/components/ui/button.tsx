import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variant === "default" && "bg-black text-white hover:bg-zinc-800",
        variant === "outline" && "border border-zinc-200 bg-white hover:bg-zinc-50",
        variant === "ghost" && "hover:bg-zinc-100",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-6",
        size === "lg" && "h-12 px-8 text-lg",
        className
      )}
      {...props}
    />
  )
}