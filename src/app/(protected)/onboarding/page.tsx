import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/actions/auth'

export default async function OnboardingPage() {
  const supabase = await createClient()

  // Check if onboarding already completed
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .single()

  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-3xl font-bold">Welcome to Audy.not</h1>
        <p className="text-muted-foreground">
          Let&apos;s get you set up. Onboarding flow coming in Phase 2.
        </p>

        {/* Placeholder - Phase 2 will add the real onboarding steps */}
        <div className="rounded-lg border p-6 text-left">
          <p className="text-sm text-muted-foreground">
            Phase 1 complete! You&apos;ve successfully authenticated.
            The onboarding flow (Telegram connection, persona configuration,
            and first product setup) will be implemented in Phase 2.
          </p>
        </div>

        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  )
}
