'use client'

import { useState } from 'react'
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper'
import { PersonaStep } from '@/components/onboarding/persona-step'
import { TelegramStep } from '@/components/onboarding/telegram-step'
import { ProductStep } from '@/components/onboarding/product-step'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { completeOnboarding, type OnboardingState, type OnboardingStep } from '@/actions/onboarding'

interface OnboardingClientProps {
  initialState: OnboardingState
}

const STEP_ORDER: OnboardingStep[] = ['persona', 'telegram', 'product']
const STEP_NAMES: Record<OnboardingStep, string> = {
  persona: 'Persona',
  telegram: 'Telegram',
  product: 'Product',
}

export function OnboardingClient({ initialState }: OnboardingClientProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialState.currentStep)
  const [completedSteps, setCompletedSteps] = useState({
    persona: initialState.hasPersona,
    telegram: initialState.hasTelegram,
    product: initialState.hasProduct,
  })

  const currentStepIndex = STEP_ORDER.indexOf(currentStep)

  function handleStepComplete(step: OnboardingStep) {
    setCompletedSteps(prev => ({ ...prev, [step]: true }))

    const currentIndex = STEP_ORDER.indexOf(step)
    const nextStep = STEP_ORDER[currentIndex + 1]

    if (nextStep) {
      setCurrentStep(nextStep)
    } else {
      // All steps complete - redirect to dashboard
      completeOnboarding()
    }
  }

  const steps = STEP_ORDER.map(step => ({
    name: STEP_NAMES[step],
    completed: completedSteps[step],
  }))

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="text-center">Welcome to Audy.not</CardTitle>
        <OnboardingStepper
          currentStep={currentStepIndex + 1}
          steps={steps}
        />
      </CardHeader>
      <CardContent>
        {currentStep === 'persona' && (
          <PersonaStep
            onComplete={() => handleStepComplete('persona')}
          />
        )}
        {currentStep === 'telegram' && (
          <TelegramStep
            onComplete={() => handleStepComplete('telegram')}
            initiallyConnected={completedSteps.telegram}
          />
        )}
        {currentStep === 'product' && (
          <ProductStep
            onComplete={() => handleStepComplete('product')}
          />
        )}
      </CardContent>
    </Card>
  )
}
