'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Mention } from '@/types/database'

interface MentionsListProps {
  mentions: (Mention & { product_name?: string })[]
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'discarded', label: 'Discarded' },
] as const

export function MentionsList({ mentions }: MentionsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = statusFilter === 'all'
    ? mentions
    : mentions.filter(m => m.status === statusFilter)

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              statusFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {opt.label}
            {opt.value !== 'all' && (
              <span className="ml-1.5 text-xs">
                ({mentions.filter(m => m.status === opt.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mentions list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {statusFilter === 'all'
              ? 'No mentions yet. The monitoring engine will find opportunities automatically.'
              : `No ${statusFilter} mentions.`}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(mention => (
            <Link key={mention.id} href={`/mentions/${mention.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-1">
                        {mention.reddit_title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        r/{mention.reddit_subreddit} &bull; by u/{mention.reddit_author}
                        {mention.product_name && (
                          <> &bull; {mention.product_name}</>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Badge variant={getIntentVariant(mention.intent)}>
                        {formatIntent(mention.intent)}
                      </Badge>
                      <Badge variant="outline">
                        {mention.confidence}%
                      </Badge>
                      <Badge variant={getStatusVariant(mention.status)}>
                        {mention.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                {mention.reddit_content && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {mention.reddit_content}
                    </p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function getIntentVariant(intent: string): 'destructive' | 'default' {
  return intent === 'pain_point' ? 'destructive' : 'default'
}

function formatIntent(intent: string): string {
  return intent === 'pain_point' ? 'Pain Point' : 'Recommendation'
}

function getStatusVariant(status: string): 'secondary' | 'default' | 'outline' {
  switch (status) {
    case 'pending': return 'secondary'
    case 'approved': return 'default'
    case 'discarded': return 'outline'
    default: return 'secondary'
  }
}
