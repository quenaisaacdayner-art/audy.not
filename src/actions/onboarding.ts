'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type OnboardingStep = 'product' | 'telegram' | 'persona'

export interface OnboardingState {
  currentStep: OnboardingStep
  hasPersona: boolean
  hasTelegram: boolean
  hasProduct: boolean
}

export async function getOnboardingState(): Promise<OnboardingState | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch profile with related data
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, onboarding_step')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  // Check what's completed
  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: telegram } = await supabase
    .from('telegram_connections')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  const hasPersona = !!persona
  const hasTelegram = !!telegram
  const hasProduct = (products?.length ?? 0) > 0

  // Determine current step based on saved step or completion status
  // Nova ordem: Product -> Telegram -> Persona
  let currentStep: OnboardingStep = 'product'

  if (profile?.onboarding_step) {
    currentStep = profile.onboarding_step as OnboardingStep
  } else {
    // Fallback: determine from completion status
    if (!hasProduct) {
      currentStep = 'product'
    } else if (!hasPersona) {
      currentStep = 'telegram' // Default to telegram after product
    } else {
      currentStep = 'persona'
    }
  }

  return {
    currentStep,
    hasPersona,
    hasTelegram,
    hasProduct,
  }
}

export async function completeOnboarding() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      onboarding_step: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  redirect('/dashboard')
}

export async function updateOnboardingStep(step: OnboardingStep) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .update({
      onboarding_step: step,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
}
