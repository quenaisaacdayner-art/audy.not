import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMentions } from '@/actions/mentions'
import { MentionsList } from './mentions-list'

export default async function MentionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const mentions = await getMentions()

  // Get last checked time from monitoring_state
  const { data: monitoringState } = await supabase
    .from('monitoring_state')
    .select('last_checked_at')
    .eq('id', 1)
    .single()

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mentions</h1>
          {monitoringState?.last_checked_at && (
            <p className="text-sm text-muted-foreground">
              Last checked: {formatRelativeTime(monitoringState.last_checked_at)}
            </p>
          )}
        </div>
      </div>
      <MentionsList mentions={mentions} />
    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}
