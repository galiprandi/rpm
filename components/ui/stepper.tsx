"use client";

import * as React from "react";
import {
  Car,
  ShoppingCart,
  ClipboardCheck,
  Check,
  LucideIcon,
  Lock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Step configuration interface
interface StepConfig {
  value: number;
  label: string;
  icon: LucideIcon;
}

// Props for the Stepper component
interface StepperProps {
  currentStep: number;
  steps?: StepConfig[];
  className?: string;
  onStepClick?: (step: number) => void;
}

// Default steps for work order creation
const DEFAULT_STEPS: StepConfig[] = [
  { value: 1, label: "Buscar Vehículo", icon: Car },
  { value: 2, label: "Servicios/Productos", icon: ShoppingCart },
  { value: 3, label: "Checklist & Finalizar", icon: ClipboardCheck },
];

export function Stepper({
  currentStep,
  steps = DEFAULT_STEPS,
  className,
  onStepClick,
}: StepperProps) {
  return (
    <TooltipProvider>
      <div
        className={cn("relative flex justify-between items-start", className)}
      >
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          const isActive = currentStep === step.value;
          const isCompleted = currentStep > step.value;
          const isClickable = onStepClick && (isCompleted || isActive);
          const isDisabled = !isClickable && !isCompleted && !isActive;

          const stepButton = (
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => onStepClick?.(step.value)}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                isActive
                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20 scale-110"
                  : isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105 cursor-pointer shadow-sm"
                    : "border-muted-foreground/30 bg-muted text-muted-foreground/50",
                isClickable &&
                  !isActive &&
                  "hover:ring-2 hover:ring-emerald-500/30",
              )}
            >
              {isCompleted ? (
                <div className="flex items-center justify-center">
                  <Check className="h-5 w-5" strokeWidth={3} />
                </div>
              ) : isDisabled ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </button>
          );

          const labelButton = (
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
                    : "text-muted-foreground/50",
                isClickable && "hover:underline",
              )}
            >
              {step.label}
            </button>
          );

          return (
            <React.Fragment key={step.value}>
              {/* Step Circle */}
              <div className="flex flex-col items-center relative z-10">
                {isDisabled ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{stepButton}</TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Completa el paso anterior para continuar</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  stepButton
                )}
                {isDisabled ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{labelButton}</TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Completa el paso anterior para continuar</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  labelButton
                )}
              </div>

              {/* Line segment between steps (not after last) */}
              {!isLast && (
                <div className="flex-1 flex items-center pt-5 px-2">
                  <div
                    className={cn(
                      "h-0.5 flex-1 transition-colors",
                      currentStep > step.value
                        ? "bg-emerald-500"
                        : "bg-neutral-300 dark:bg-neutral-600",
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// Export default steps for use in other components
export { DEFAULT_STEPS as WORK_ORDER_STEPS, Stepper as WorkOrderStepper };
export type { StepConfig, StepperProps as WorkOrderStepperProps };
