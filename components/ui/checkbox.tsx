"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  labelClassName?: string
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, labelClassName, onCheckedChange, ...props }, ref) => {
    return (
      <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            ref={ref}
            className="peer sr-only"
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            {...props}
          />
          <div
            className={cn(
              "h-6 w-6 rounded border-2 border-muted-foreground/30 bg-background transition-all peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:opacity-50",
              className
            )}
          >
            <Check
              className="h-4 w-4 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              strokeWidth={3}
            />
          </div>
        </div>
        {label && (
          <span className={cn("text-sm select-none", labelClassName)}>
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </span>
        )}
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
