'use server'

import { createClient } from '@/lib/supabase/server'
import { generateDeepLink } from '@/lib/telegram/bot'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export interface ConnectionTokenResult {
  success: boolean
  token?: string
  deepLink?: string
  error?: string
}

export async function generateConnectionToken(): Promise<ConnectionTokenResult> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Delete any existing tokens for this user (single-use)
  await supabase
    .from('telegram_connection_tokens')
    .delete()
    .eq('user_id', user.id)

  // Generate new token with 30-minute expiry
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  const { error: insertError } = await supabase
    .from('telegram_connection_tokens')
    .insert({
      token,
      user_id: user.id,
      expires_at: expiresAt,
    })

  if (insertError) {
    console.error('Token insert error:', insertError)
    return { success: false, error: 'Failed to generate connection token' }
  }

  try {
    const deepLink = generateDeepLink(token)
    return {
      success: true,
      token,
      deepLink,
    }
  } catch (error) {
    console.error('Deep link generation error:', error)
    return { success: false, error: 'Telegram bot not configured' }
  }
}

export interface ConnectionStatus {
  connected: boolean
  chatId?: number
}

export async function checkTelegramConnection(): Promise<ConnectionStatus> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { connected: false }
  }

  const { data: connection } = await supabase
    .from('telegram_connections')
    .select('telegram_chat_id')
    .eq('user_id', user.id)
    .single()

  return {
    connected: !!connection,
    chatId: connection?.telegram_chat_id,
  }
}

export async function skipTelegramStep() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Update onboarding step to persona (next step after telegram)
  await supabase
    .from('profiles')
    .update({ onboarding_step: 'persona' })
    .eq('id', user.id)

  revalidatePath('/onboarding')
}

export async function completeTelegramStep() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Update onboarding step to persona (next step after telegram)
  await supabase
    .from('profiles')
    .update({ onboarding_step: 'persona' })
    .eq('id', user.id)

  revalidatePath('/onboarding')
}
