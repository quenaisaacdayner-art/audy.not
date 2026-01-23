import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getProduct } from '@/actions/products'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react'
import { DeleteProductButton } from './delete-button'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  const product = await getProduct(id)
  if (!product) {
    notFound()
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              {product.url && (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:underline flex items-center gap-1 mt-1"
                >
                  {product.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/products/${id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <DeleteProductButton productId={id} productName={product.name} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {product.description && (
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          <div>
            <h3 className="font-medium mb-2">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {product.keywords.map((kw: string) => (
                <Badge key={kw} variant="secondary">{kw}</Badge>
              ))}
              {product.keywords.length === 0 && (
                <span className="text-muted-foreground text-sm">No keywords configured</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Monitored Subreddits</h3>
            <div className="flex flex-wrap gap-2">
              {product.subreddits.map((sub: string) => (
                <Badge key={sub} variant="outline">r/{sub}</Badge>
              ))}
              {product.subreddits.length === 0 && (
                <span className="text-muted-foreground text-sm">No subreddits configured</span>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-4 border-t">
            Created: {new Date(product.created_at).toLocaleDateString()}
            {product.updated_at !== product.created_at && (
              <> · Updated: {new Date(product.updated_at).toLocaleDateString()}</>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
