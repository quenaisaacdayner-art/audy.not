'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoginForm } from './login-form'
import { SignupForm } from './signup-form'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultView?: 'login' | 'signup'
}

export function AuthModal({ open, onOpenChange, defaultView = 'signup' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'signup'>(defaultView)

  // Reset view when modal opens with a different default
  useEffect(() => {
    if (open) {
      setView(defaultView)
    }
  }, [open, defaultView])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* Logo only at top per CONTEXT.md */}
          <div className="flex justify-center mb-2">
            <span className="text-2xl font-bold">Audy.not</span>
          </div>
          <DialogTitle className="text-center">
            {view === 'login' ? 'Bem-vindo de volta' : 'Criar uma conta'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {view === 'login'
              ? 'Entre com sua conta usando Google ou e-mail e senha'
              : 'Crie sua conta usando Google ou e-mail e senha'}
          </DialogDescription>
        </DialogHeader>

        {view === 'login' ? (
          <LoginForm onSwitchToSignup={() => setView('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setView('login')} />
        )}
      </DialogContent>
    </Dialog>
  )
}
