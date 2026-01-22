'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  generateConnectionToken,
  checkTelegramConnection,
  skipTelegramStep,
  completeTelegramStep
} from '@/actions/telegram'
import { CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react'

interface TelegramStepProps {
  onComplete: () => void
  initiallyConnected?: boolean
}

export function TelegramStep({ onComplete, initiallyConnected = false }: TelegramStepProps) {
  const [deepLink, setDeepLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [connected, setConnected] = useState(initiallyConnected)
  const [error, setError] = useState<string | null>(null)

  // Generate connection token on mount
  useEffect(() => {
    async function init() {
      if (initiallyConnected) {
        setLoading(false)
        return
      }

      const result = await generateConnectionToken()
      if (result.success && result.deepLink) {
        setDeepLink(result.deepLink)
      } else {
        setError(result.error || 'Failed to generate connection link')
      }
      setLoading(false)
    }
    init()
  }, [initiallyConnected])

  async function handleCheckConnection() {
    setChecking(true)
    setError(null)

    const status = await checkTelegramConnection()
    setConnected(status.connected)

    if (!status.connected) {
      setError('Not connected yet. Make sure you clicked the link and started the bot in Telegram.')
    }

    setChecking(false)
  }

  async function handleContinue() {
    await completeTelegramStep()
    onComplete()
  }

  async function handleSkip() {
    await skipTelegramStep()
    onComplete()
  }

  async function handleRefreshLink() {
    setLoading(true)
    setError(null)
    const result = await generateConnectionToken()
    if (result.success && result.deepLink) {
      setDeepLink(result.deepLink)
    } else {
      setError(result.error || 'Failed to generate connection link')
    }
    setLoading(false)
  }

  if (connected) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Telegram Connected!</h3>
          <p className="text-muted-foreground">
            You&apos;ll receive notifications about new opportunities directly in Telegram.
          </p>
        </div>
        <Button onClick={handleContinue} className="w-full">
          Continue
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Connect Telegram (Optional)</h3>
        <p className="text-muted-foreground">
          Get notified about new opportunities directly in Telegram.
          You can always connect later from settings.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : deepLink ? (
        <div className="space-y-4">
          {/* QR Code */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Scan with your phone</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center pb-4">
              <QRCodeSVG
                value={deepLink}
                size={180}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
              />
            </CardContent>
          </Card>

          {/* Or use deep link button */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" asChild>
            <a href={deepLink} target="_blank" rel="noopener noreferrer">
              Open in Telegram
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>

          {/* Instructions */}
          <p className="text-sm text-muted-foreground text-center">
            After opening the bot, click <strong>Start</strong> to connect your account.
          </p>
        </div>
      ) : null}

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <div className="space-y-2">
        <Button
          onClick={handleCheckConnection}
          disabled={checking || loading}
          className="w-full"
        >
          {checking ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Check Connection'
          )}
        </Button>

        <Button variant="ghost" onClick={handleSkip} className="w-full">
          Skip for now
        </Button>

        {deepLink && (
          <Button
            variant="link"
            onClick={handleRefreshLink}
            className="w-full text-xs"
            disabled={loading}
          >
            Link expired? Generate new one
          </Button>
        )}
      </div>
    </div>
  )
}
