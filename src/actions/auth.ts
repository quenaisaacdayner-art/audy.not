'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signupSchema, loginSchema } from '@/lib/validations/auth'

export type AuthResult = {
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const validatedFields = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { fieldErrors: validatedFields.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { email, password } = validatedFields.data

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    // Generic message for security (don't reveal if email exists)
    return { error: 'Não foi possível criar a conta. Tente novamente.' }
  }

  redirect('/onboarding')
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { fieldErrors: validatedFields.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { email, password } = validatedFields.data

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Generic message for security
    return { error: 'Credenciais inválidas' }
  }

  // Check if onboarding completed
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .single()

  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  } else {
    redirect('/onboarding')
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
