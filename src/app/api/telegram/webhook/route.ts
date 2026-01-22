export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { webhookCallback } from 'grammy'
import { bot } from '@/lib/telegram/bot'

// Create webhook handler using grammY's built-in adapter for standard HTTP
// This handles receiving Telegram updates and passing them to the bot instance
export const POST = bot
  ? webhookCallback(bot, 'std/http')
  : async () => {
      console.error('Telegram webhook called but bot is not configured')
      return NextResponse.json(
        { error: 'Telegram bot is not configured' },
        { status: 503 }
      )
    }

// Note: To register this webhook with Telegram, run:
// curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_URL>/api/telegram/webhook"
//
// Requirements:
// - HTTPS with valid SSL certificate (Telegram rejects self-signed certs)
// - Publicly accessible URL (use ngrok/cloudflared for local dev if needed)
// - Or use long polling for local development instead
