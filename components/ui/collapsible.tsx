"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open, onOpenChange, children, ...props }, ref) => {
    return (
      <div ref={ref} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { open, onOpenChange } as any)
          }
          return child
        })}
      </div>
    )
  }
)
Collapsible.displayName = "Collapsible"

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  asChild?: boolean
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, children, open, onOpenChange, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(className)}
        onClick={() => onOpenChange?.(!open)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
CollapsibleTrigger.displayName = "CollapsibleTrigger"

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, children, open, ...props }, ref) => {
    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

