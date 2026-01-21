import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/actions/auth'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user and profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .single()

  // Redirect to onboarding if not completed
  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name || user?.email}!
        </p>

        {/* Placeholder - Phase 5 will add the real dashboard */}
        <div className="rounded-lg border p-6 text-left">
          <p className="text-sm text-muted-foreground">
            Dashboard coming in Phase 5. This placeholder confirms
            that authentication and routing are working correctly.
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
