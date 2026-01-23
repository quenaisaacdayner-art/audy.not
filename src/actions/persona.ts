'use server'

import { createClient } from '@/lib/supabase/server'
import { personaFormSchema, type PersonaFormData } from '@/lib/validations/persona'
import { revalidatePath } from 'next/cache'

export interface PersonaActionResult {
  success: boolean
  error?: string
}

export async function savePersona(formData: PersonaFormData): Promise<PersonaActionResult> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate input
  const validationResult = personaFormSchema.safeParse(formData)
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0]?.message || 'Invalid input'
    }
  }

  const data = validationResult.data

  // Determine final tone value
  const finalTone = data.tone === 'Custom' ? data.customTone : data.tone

  // Upsert persona (insert or update if exists)
  const { error: upsertError } = await supabase
    .from('personas')
    .upsert({
      user_id: user.id,
      expertise: data.expertise,
      tone: finalTone,
      phrases_to_avoid: data.phrasesToAvoid || null,
      target_audience: data.targetAudience,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    })

  if (upsertError) {
    console.error('Persona save error:', upsertError)
    return { success: false, error: 'Falha ao salvar persona' }
  }

  // Persona is the last step - no need to update onboarding_step
  // The client will call completeOnboarding() which sets onboarding_completed=true

  revalidatePath('/onboarding')

  return { success: true }
}

export async function getPersona() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('personas')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data
}
