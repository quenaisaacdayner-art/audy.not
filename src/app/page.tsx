'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthModal } from '@/components/auth/auth-modal'

function AuthErrorMessage() {
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')

  if (!authError) return null

  return (
    <p className="mt-4 text-sm text-destructive">
      Authentication failed. Please try again.
    </p>
  )
}

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authView, setAuthView] = useState<'login' | 'signup'>('signup')

  function openSignup() {
    setAuthView('signup')
    setAuthModalOpen(true)
  }

  function openLogin() {
    setAuthView('login')
    setAuthModalOpen(true)
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-xl font-bold">Audy.not</span>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={openLogin}>
              Sign in
            </Button>
            <Button onClick={openSignup}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Reddit opportunities, delivered to Telegram
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Audy.not monitors Reddit for people who need your product.
          AI drafts personalized replies. You approve and post.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button size="lg" onClick={openSignup}>
            Start free trial
          </Button>
          <Button size="lg" variant="outline" onClick={openLogin}>
            Sign in
          </Button>
        </div>

        {/* Auth error message */}
        <Suspense fallback={null}>
          <AuthErrorMessage />
        </Suspense>
      </section>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultView={authView}
      />
    </main>
  )
}
