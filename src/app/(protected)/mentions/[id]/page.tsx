import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getMention } from '@/actions/mentions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { CopyReplyButton } from './copy-reply-button'

interface MentionPageProps {
  params: Promise<{ id: string }>
}

export default async function MentionPage({ params }: MentionPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const mention = await getMention(id)
  if (!mention) notFound()

  return (
    <div className="container py-8 max-w-3xl">
      {/* Back link */}
      <Link
        href="/mentions"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Mentions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">{mention.reddit_title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>r/{mention.reddit_subreddit}</span>
            <span>&bull;</span>
            <span>u/{mention.reddit_author}</span>
            <span>&bull;</span>
            <span>{formatDate(mention.reddit_created_at)}</span>
            {mention.product_name && (
              <>
                <span>&bull;</span>
                <span>{mention.product_name}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Badge variant={mention.intent === 'pain_point' ? 'destructive' : 'default'}>
            {mention.intent === 'pain_point' ? 'Pain Point' : 'Recommendation'}
          </Badge>
          <Badge variant="outline">{mention.confidence}% confidence</Badge>
          <Badge variant={getStatusVariant(mention.status)}>{mention.status}</Badge>
        </div>
      </div>

      {/* Post content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Original Post</CardTitle>
        </CardHeader>
        <CardContent>
          {mention.reddit_content ? (
            <p className="whitespace-pre-wrap">{mention.reddit_content}</p>
          ) : (
            <p className="text-muted-foreground italic">No post body (link post)</p>
          )}
          <div className="mt-4">
            <a
              href={mention.reddit_permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              View on Reddit
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Draft reply */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Draft Reply</CardTitle>
          <CardDescription>
            AI-generated reply based on your persona. Edit as needed before posting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mention.draft_reply ? (
            <>
              <div className="bg-muted p-4 rounded-md mb-4">
                <p className="whitespace-pre-wrap">{mention.draft_reply}</p>
              </div>
              <CopyReplyButton text={mention.draft_reply} />
            </>
          ) : (
            <p className="text-muted-foreground italic">
              Draft generation failed. You can regenerate via Telegram.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Discovered</dt>
              <dd>{formatDateTime(mention.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd>{formatDateTime(mention.updated_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{mention.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Confidence</dt>
              <dd>{mention.confidence}%</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function getStatusVariant(status: string): 'secondary' | 'default' | 'outline' {
  switch (status) {
    case 'pending': return 'secondary'
    case 'approved': return 'default'
    case 'discarded': return 'outline'
    default: return 'secondary'
  }
}
