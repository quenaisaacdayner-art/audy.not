import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/?error=auth`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .single()

      if (profile?.onboarding_completed) {
        return NextResponse.redirect(`${origin}/dashboard`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Code exchange error:', exchangeError)
  }

  // OAuth error - redirect to home with error param
  return NextResponse.redirect(`${origin}/?error=auth`)
}
