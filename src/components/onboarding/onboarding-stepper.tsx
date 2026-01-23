'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface OnboardingStepperProps {
  currentStep: number  // 1, 2, or 3
  steps: Array<{
    name: string
    completed: boolean
  }>
}

export function OnboardingStepper({ currentStep, steps }: OnboardingStepperProps) {
  return (
    <div className="w-full">
      {/* Step indicator text */}
      <p className="text-sm text-muted-foreground text-center mb-4">
        Passo {currentStep} de {steps.length}
      </p>

      {/* Progress bar with circles */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = step.completed

          return (
            <div key={step.name} className="flex items-center">
              {/* Step circle */}
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors',
                  isCompleted
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isActive
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground/30 text-muted-foreground/50'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Step name (visible on larger screens) */}
              <span
                className={cn(
                  'ml-2 text-sm hidden sm:inline',
                  isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {step.name}
              </span>

              {/* Connector line (not after last step) */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-8 sm:w-12 h-0.5 mx-2',
                    step.completed ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
