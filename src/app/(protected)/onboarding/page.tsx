import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOnboardingState, completeOnboarding } from '@/actions/onboarding'
import { OnboardingClient } from './onboarding-client'

export default async function OnboardingPage() {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // Get onboarding state
  const state = await getOnboardingState()
  if (!state) {
    redirect('/')
  }

  // If user has product, onboarding is complete
  if (state.hasProduct) {
    await completeOnboarding()
    // redirect happens in completeOnboarding
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <OnboardingClient initialState={state} />
      </div>
    </main>
  )
}
