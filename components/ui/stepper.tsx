"use client"

import * as React from "react"
import { Car, ShoppingCart, ClipboardCheck, Check, LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Step configuration interface
interface StepConfig {
  value: number
  label: string
  icon: LucideIcon
}

// Props for the WorkOrderStepper component
interface WorkOrderStepperProps {
  currentStep: number
  steps?: StepConfig[]
  className?: string
  onStepClick?: (step: number) => void
}

// Default steps for work order creation
const DEFAULT_STEPS: StepConfig[] = [
  { value: 1, label: "Buscar Vehículo", icon: Car },
  { value: 2, label: "Servicios/Productos", icon: ShoppingCart },
  { value: 3, label: "Checklist & Finalizar", icon: ClipboardCheck },
]

export function WorkOrderStepper({
  currentStep,
  steps = DEFAULT_STEPS,
  className,
  onStepClick,
}: WorkOrderStepperProps) {
  return (
    <div className={cn("relative flex justify-between items-start", className)}>
      {steps.map((step, index) => {
        const Icon = step.icon
        const isLast = index === steps.length - 1
        const isActive = currentStep === step.value
        const isCompleted = currentStep > step.value
        const isClickable = onStepClick && (isCompleted || isActive)

        return (
          <React.Fragment key={step.value}>
            {/* Step Circle */}
            <div className="flex flex-col items-center relative z-10">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onStepClick?.(step.value)}
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20 scale-110"
                    : isCompleted
                      ? "border-green-500 bg-emerald-500 text-white hover:bg-green-600 hover:scale-105 cursor-pointer shadow-sm"
                      : "border-neutral-400 bg-neutral-400 text-white opacity-70 dark:border-neutral-500 dark:bg-neutral-500",
                  isClickable && !isActive && "hover:ring-2 hover:ring-green-500/30"
                )}
              >
                {isCompleted ? (
                  <div className="flex items-center justify-center">
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </div>
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onStepClick?.(step.value)}
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[100px] leading-tight transition-colors",
                  isActive
                    ? "text-primary"
                    : isCompleted
                      ? "text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      : "text-muted-foreground",
                  isClickable && "hover:underline"
                )}
              >
                {step.label}
              </button>
            </div>

            {/* Line segment between steps (not after last) */}
            {!isLast && (
              <div className="flex-1 flex items-center pt-5 px-2">
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors",
                    currentStep > step.value ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// Export default steps for use in other components
export { DEFAULT_STEPS as WORK_ORDER_STEPS }
export type { StepConfig, WorkOrderStepperProps }
