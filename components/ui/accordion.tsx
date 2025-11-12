"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionContextValue {
  value: string | string[]
  onValueChange: (value: string) => void
  type: "single" | "multiple"
  collapsible?: boolean
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)
const AccordionItemContext = React.createContext<string>("")

interface AccordionProps {
  type?: "single" | "multiple"
  collapsible?: boolean
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  children: React.ReactNode
  className?: string
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", collapsible = true, value: controlledValue, onValueChange, children, className, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState<string | string[]>(
      type === "single" ? "" : []
    )
    
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue
    const handleValueChange = React.useCallback((itemValue: string) => {
      if (type === "single") {
        const newValue = value === itemValue && collapsible ? "" : itemValue
        if (onValueChange) {
          onValueChange(newValue)
        } else {
          setUncontrolledValue(newValue)
        }
      } else {
        const currentArray = Array.isArray(value) ? value : []
        const newValue = currentArray.includes(itemValue)
          ? currentArray.filter((v) => v !== itemValue)
          : [...currentArray, itemValue]
        if (onValueChange) {
          onValueChange(newValue)
        } else {
          setUncontrolledValue(newValue)
        }
      }
    }, [value, type, collapsible, onValueChange])

    const contextValue = React.useMemo(
      () => ({ value, onValueChange: handleValueChange, type, collapsible }),
      [value, handleValueChange, type, collapsible]
    )

    return (
      <AccordionContext.Provider value={contextValue}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = "Accordion"

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => {
    return (
      <AccordionItemContext.Provider value={value}>
        <div
          ref={ref}
          className={cn("border-b", className)}
          data-value={value}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    )
  }
)
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    const itemValue = React.useContext(AccordionItemContext)
    if (!context) throw new Error("AccordionTrigger must be used within Accordion")

    const isOpen = React.useMemo(() => {
      if (!itemValue) return false
      if (context.type === "single") {
        return context.value === itemValue
      }
      return Array.isArray(context.value) && context.value.includes(itemValue)
    }, [context.value, context.type, itemValue])

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
          className
        )}
        onClick={() => itemValue && context.onValueChange(itemValue)}
        {...props}
      >
        {children}
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
    )
  }
)
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext)
    const itemValue = React.useContext(AccordionItemContext)
    if (!context) throw new Error("AccordionContent must be used within Accordion")

    const isOpen = React.useMemo(() => {
      if (!itemValue) return false
      if (context.type === "single") {
        return context.value === itemValue
      }
      return Array.isArray(context.value) && context.value.includes(itemValue)
    }, [context.value, context.type, itemValue])

    if (!isOpen) return null

    return (
      <div
        ref={ref}
        className={cn("overflow-hidden text-sm transition-all pb-4 pt-0", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

